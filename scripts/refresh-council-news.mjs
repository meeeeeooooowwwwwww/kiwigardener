// This can run from a nightly GitHub Actions workflow to keep static Council news fresh.
import {readFile,writeFile} from "node:fs/promises";
import {fetchCouncilNews,validateStoredNews} from "./council-news-feed.mjs";
const location=new URL("../src/council-news.json",import.meta.url);
const stories=await fetchCouncilNews({timeout:13000});
const current=validateStoredNews(JSON.parse(await readFile(location,"utf8")));
const changed=JSON.stringify(stories)!==JSON.stringify(current);
console.log("Newsline garden feed: "+stories.length+" relevant titles; "+(changed?"changed":"unchanged"));
for(const s of stories.slice(0,5))console.log("  "+s.date+" "+s.title+" "+s.url);
if(process.argv.includes("--write")&&changed){
 await writeFile(location,JSON.stringify(stories,null,2)+"\n");
 console.log("Updated src/council-news.json");
}
