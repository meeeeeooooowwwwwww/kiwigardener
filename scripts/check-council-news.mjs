import test from "node:test";
import assert from "node:assert/strict";
import {parseCouncilFeed,validateStoredNews} from "./council-news-feed.mjs";
import {councilNewsSection} from "../src/council-news.mjs";
const today=new Date().toUTCString();
const date=new Date().toISOString().slice(0,10);
const rss='<?xml version="1.0"?><rss version="2.0"><channel><title>Newsline</title>'+
  '<item><title><![CDATA[New native planting &amp; gardens in Linwood]]></title>'+
  '<link>https://www.newsline.ccc.govt.nz/news/story/native-gardens-linwood</link><pubDate>'+today+'</pubDate><description>Wetlands and community planting in Linwood.</description></item>'+
  '<item><title>Christchurch road closures on Main Street</title><link>https://www.newsline.ccc.govt.nz/news/story/road-closures</link><pubDate>'+today+'</pubDate></item>'+
  '<item><title>Latest updates on the Wastewater Treatment Plant</title><link>https://www.newsline.ccc.govt.nz/news/story/wastewater-plant</link><pubDate>'+today+'</pubDate></item>'+
  '<item><title>New flowers at our city gardens</title><link>https://www.example.com/evil</link><pubDate>'+today+'</pubDate></item>'+
  '</channel></rss>';
const entry={title:"New native planting & gardens in Linwood",url:"https://www.newsline.ccc.govt.nz/news/story/native-gardens-linwood",date};
test("RSS parsing filters irrelevant headlines and unexpected domains",()=>{
  assert.deepEqual(parseCouncilFeed(rss),[entry]);
  assert.deepEqual(validateStoredNews([entry,{title:"Road closure",date,url:"https://evil.test/a"},{title:"Latest updates on the Wastewater Treatment Plant",date,url:"https://www.newsline.ccc.govt.nz/news/story/wastewater-plant"}]),[entry]);
});
test("Only appropriate pages get small, sourced Council news",()=>{
  const news=[entry];
  for(const path of ["/","/plants/","/guides/","/areas/","/services/","/guides/native-plants-christchurch/","/areas/linwood/","/areas/cashmere/","/services/garden-maintenance/"]){
    const html=councilNewsSection(path,news);
    assert.match(html,/council-updates/);
    assert.match(html,/From around our gardens/);
    assert.match(html,/council-news-photo/);
    assert.match(html,/Illustrative/);
    assert.match(html,/Christchurch City Council/);
    assert.match(html,/datetime="/);
    assert.match(html,/rel="noopener noreferrer"/);
  }
  for(const path of ["/contact/","/privacy/","/plants/acca-sellowiana/"]){
    assert.equal(councilNewsSection(path,news),"");
  }
});
test("Unverified, stale and off-topic feed entries never publish",()=>{
  const old={...entry,date:"2020-01-01"};
  assert.equal(councilNewsSection("/plants/",[old]),"");
});

test("Cached licensed photographs, never CCC logos or copied Newsline images",()=>{
  const html=councilNewsSection("/plants/",[entry],new Set(["botanic"]));
  assert.match(html,/src="\/assets\/council-news\/botanic.jpg"/);
  assert.match(html,/commons.wikimedia.org/);
  assert.doesNotMatch(html,/<img[^>]*ccc.govt.nz/);
  assert.doesNotMatch(html,/Official Council logo|Council approved/);
});
test("Broader coverage still excludes industrial plant stories",()=>{
  const broad={title:"Students help restore Lyttelton Harbour",url:"https://www.newsline.ccc.govt.nz/news/story/students-restore-lyttelton-harbour",date};
  assert.deepEqual(parseCouncilFeed('<?xml version="1.0"?><rss><channel><item><title>'+broad.title+'</title><link>'+broad.url+'</link><pubDate>'+today+'</pubDate></item></channel></rss>'),[broad]);
  assert.match(councilNewsSection("/areas/cashmere/",[broad]),/Students help restore Lyttelton Harbour/);
});
