export const playlistFixtureId='PLoriginalFixture12345';
export const playlistVideos=[{id:'abcdefghijk',title:'Cours A : première partie'},{id:'bcdefghijkl',title:'Cours B : deuxième partie'},{id:'cdefghijklm',title:'Cours C : troisième partie'}];
export function playlistItem(item,index,{unavailable=false,lockup=false}={}){
 if(lockup)return{lockupViewModel:{contentType:'LOCKUP_CONTENT_TYPE_VIDEO',contentId:item.id,metadata:{lockupMetadataViewModel:{title:{content:item.title}}},rendererContext:{commandContext:{onTap:{innertubeCommand:{watchEndpoint:{videoId:item.id,playlistId:playlistFixtureId}}}}}}};
 return{playlistVideoRenderer:{videoId:item.id,title:{runs:[{text:item.title}]},index:{simpleText:String(index+1)},playlistSetVideoId:'entry-'+index,isPlayable:!unavailable,navigationEndpoint:{watchEndpoint:{videoId:item.id,playlistId:playlistFixtureId}},...(unavailable?{unplayableText:{simpleText:'Private video'}}:{})}};
}
export const playlistContinuation=token=>({continuationItemViewModel:{trigger:'CONTINUATION_TRIGGER_ON_ITEM_SHOWN',continuationCommand:{innertubeCommand:{continuationCommand:{token}}}}});
export function playlistData(items,{title='Playlist : cours / exemples',continuation,id=playlistFixtureId}={}){
 return{metadata:{playlistMetadataRenderer:{title}},microformat:{microformatDataRenderer:{urlCanonical:`https://www.youtube.com/playlist?list=${id}`}},contents:{twoColumnBrowseResultsRenderer:{tabs:[{tabRenderer:{selected:true,content:{sectionListRenderer:{contents:[{itemSectionRenderer:{contents:[{playlistVideoListRenderer:{playlistId:id,contents:[...items,...(continuation?[playlistContinuation(continuation)]:[])]}}]}}]}}}}]}}};
}
export function playlistPage(data){const json=JSON.stringify(data).replaceAll('<','\\u003c');return`<!doctype html><meta charset="utf-8"><title>Playlist : cours / exemples - YouTube</title><h1>Original authorised playlist fixture</h1><script>window.ytInitialData=${json};window.ytcfg={get:k=>k==='INNERTUBE_CONTEXT'?{client:{clientName:'WEB',clientVersion:'fixture'}}:undefined};document.dispatchEvent(new Event('yt-page-data-updated'));</script>`;}
