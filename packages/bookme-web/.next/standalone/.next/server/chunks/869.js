"use strict";exports.id=869,exports.ids=[869],exports.modules={4407:(t,e,r)=>{let o=r(2048),i=r(5315);class n{static exportMarkdown(t){let e="";return e+=`# ${t.title}

**By ${t.author}**

`,t.description&&(e+=`${t.description}

`),e+=`---

## Table of Contents

`,t.tableOfContents.forEach(t=>{e+=`- **${t.chapterTitle}** (Chapter ${t.chapterNumber})
`,t.sections.forEach(t=>{t.title&&(e+=`  - ${t.title}
`)})}),e+=`
---

`,t.chapters.forEach(t=>{e+=`## ${t.title}

`,t.sections.forEach(t=>{t.title&&(e+=`### ${t.title}

`),e+=`${t.content}

`}),e+=`
---

`}),e}static exportHTML(t){let e=this.getBaseCSS(),r="";return r+=`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title}</title>
  <style>
${e}
  </style>
</head>
<body>
<div class="cover" style="background-color: ${t.cover.backgroundColor}; color: ${t.cover.textColor};">
  <h1>${t.title}</h1>
  <p class="author">${t.author}</p>
`,t.description&&(r+=`  <p class="description">${t.description}</p>
`),r+=`</div>

<div class="toc">
  <h2>Table of Contents</h2>
  <ul>
`,t.tableOfContents.forEach(t=>{r+=`    <li><strong>${t.chapterTitle}</strong> (Chapter ${t.chapterNumber})
`,t.sections.length>0&&(r+=`      <ul>
`,t.sections.forEach(t=>{t.title&&(r+=`        <li>${t.title}</li>
`)}),r+=`      </ul>
`),r+=`    </li>
`}),r+=`  </ul>
</div>

<div class="content">
`,t.chapters.forEach(t=>{r+=`  <div class="chapter">
    <h2>${t.title}</h2>
`,t.sections.forEach(t=>{r+=`    <div class="section">
`,t.title&&(r+=`      <h3>${t.title}</h3>
`),r+=`      <div class="section-content">
        ${t.content.split("\n").map(t=>`<p>${t}</p>`).join("")}
      </div>
    </div>
`}),r+=`  </div>
`}),r+=`</div>
</body>
</html>
`}static exportJSON(t){return JSON.stringify(t,null,2)}static exportText(t){let e="";return e+=`${t.title}
By ${t.author}

`,t.description&&(e+=`${t.description}

`),e+=`${"=".repeat(60)}

Table of Contents

`,t.tableOfContents.forEach(t=>{e+=`${t.chapterNumber}. ${t.chapterTitle}
`,t.sections.forEach(t=>{t.title&&(e+=`   - ${t.title}
`)})}),e+=`
${"=".repeat(60)}

`,t.chapters.forEach(t=>{e+=`Chapter ${t.number}: ${t.title}

`,t.sections.forEach(t=>{t.title&&(e+=`${t.title}

`),e+=`${t.content}

`}),e+=`
${"=".repeat(60)}

`}),e}static exportToFile(t,e,r="markdown"){let n,s;switch(r.toLowerCase()){case"html":n=this.exportHTML(t),s=".html";break;case"json":n=this.exportJSON(t),s=".json";break;case"text":case"txt":n=this.exportText(t),s=".txt";break;default:n=this.exportMarkdown(t),s=".md"}let a=e.endsWith(s)?e:e+s,l=i.dirname(a);return o.existsSync(l)||o.mkdirSync(l,{recursive:!0}),o.writeFileSync(a,n,"utf8"),a}static getBaseCSS(){return`
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: Georgia, serif;
        line-height: 1.6;
        color: #333;
        background: #fff;
      }

      .cover {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        padding: 2rem;
        page-break-after: always;
      }

      .cover h1 {
        font-size: 3.5rem;
        margin-bottom: 2rem;
        font-weight: bold;
      }

      .cover .author {
        font-size: 1.5rem;
        margin-bottom: 2rem;
        font-style: italic;
      }

      .cover .description {
        font-size: 1.1rem;
        max-width: 600px;
      }

      .toc {
        page-break-after: always;
        padding: 2rem;
        max-width: 900px;
        margin: 0 auto;
      }

      .toc h2 {
        font-size: 2rem;
        margin-bottom: 2rem;
      }

      .toc ul {
        list-style: none;
        padding-left: 2rem;
      }

      .toc li {
        margin-bottom: 0.5rem;
      }

      .toc ul ul {
        padding-left: 2rem;
        margin-top: 0.3rem;
      }

      .content {
        max-width: 900px;
        margin: 0 auto;
        padding: 2rem;
      }

      .chapter {
        page-break-before: always;
        margin-bottom: 3rem;
      }

      .chapter h2 {
        font-size: 2rem;
        margin: 2rem 0 1.5rem 0;
        font-weight: bold;
      }

      .section {
        margin-bottom: 2rem;
      }

      .section h3 {
        font-size: 1.3rem;
        margin: 1.5rem 0 1rem 0;
        font-weight: bold;
      }

      .section-content p {
        margin-bottom: 1rem;
        text-align: justify;
      }

      @media print {
        body {
          line-height: 1.5;
        }

        .chapter h2 {
          page-break-after: avoid;
        }

        .section h3 {
          page-break-after: avoid;
        }
      }
    `}}t.exports=n},9807:(t,e,r)=>{let o=r(2048),i=r(5315),n=r(6890),s=r(4407),{ProjectManager:a}=r(3836),{DriveExtractor:l,DriveDownloader:d}=r(5075);class c{constructor(t="./"){this.baseDir=t,this.projectsDir=i.join(t,"bookme-projects"),this.pm=new a(i.join(t,"projects")),this.ensureDir(this.projectsDir)}createBookFromProject(t,e={}){let r=this.pm.getProject(t);if(!r)throw Error(`Project not found: ${t}`);let o=n.createBook({title:r.title,author:e.author||"Anonymous",description:r.description,driveUrl:r.driveUrl,driveFileId:r.driveFileId});return r.driveUrl&&!e.content&&(console.log(`📥 Drive file ready: ${r.driveFileId}`),console.log("   Use: aiox drive download <url> --output content.txt"),console.log("   Then: aiox bookme integrate <project-id> --content content.txt")),this.saveBook(o),this.pm.updateProject(t,{description:`${r.description}

[BookMe ID: ${o.id}]`}),o}integrateFromDrive(t,e,r={}){let o=this.pm.getProject(t);o?(this.pm.updateProject(t,{driveUrl:e}),o=this.pm.getProject(t)):o=this.pm.createProject({title:r.title||"Untitled Book",description:r.description||"",driveUrl:e});let i=l.extractFileId(e);l.parseUrl(e);let s=n.createBook({title:o.title,author:r.author||"Anonymous",description:o.description,driveUrl:e,driveFileId:i});return r.content?(n.processContent(s,r.content),console.log(`✅ Processed: ${s.metadata.chapterCount} chapters, ${s.metadata.wordCount} words`)):console.log(`📥 Ready to process. Download file and provide content.`),this.saveBook(s),this.pm.updateProject(o.id,{description:`${o.description}
[BookMe: ${s.id}]`}),{project:o,book:s}}updateBook(t,e={}){let r=this.loadBook(t);if(!r)throw Error(`Book not found: ${t}`);return e.title&&(r.title=e.title),e.author&&(r.author=e.author),e.description&&(r.description=e.description),e.cover&&Object.assign(r.cover,e.cover),r.metadata.updatedAt=new Date().toISOString(),this.saveBook(r),r}exportBook(t,e=null){let r=this.loadBook(t);if(!r)throw Error(`Book not found: ${t}`);let o=e||i.join(this.baseDir,"bookme-exports",t);this.ensureDir(o);let n={};return["markdown","html","json","text"].forEach(t=>{let e=`${r.id}.${"text"===t?"txt":"markdown"===t?"md":t}`,a=i.join(o,e);s.exportToFile(r,a,t),n[t]=a}),{bookId:r.id,title:r.title,exports:n,exportDir:o}}getBookWithProject(t){let e=this.loadBook(t);if(!e)throw Error(`Book not found: ${t}`);let r=this.pm.listProjects().find(e=>e.description?.includes(`BookMe: ${t}`));return{book:e,project:r,summary:{title:e.title,author:e.author,chapters:e.metadata.chapterCount,words:e.metadata.wordCount,status:e.metadata.status,hasProject:!!r}}}listBooks(t={}){let e=o.readdirSync(this.projectsDir).filter(t=>t.endsWith(".json")&&t.startsWith("book_")).map(t=>{try{let e=JSON.parse(o.readFileSync(i.join(this.projectsDir,t),"utf8")),r=this.pm.listProjects().find(t=>t.description?.includes(`BookMe: ${e.id}`));return{id:e.id,title:e.title,author:e.author,chapters:e.metadata.chapterCount,words:e.metadata.wordCount,status:e.metadata.status,projectId:r?.id||null,driveUrl:e.driveUrl}}catch(t){return null}}).filter(Boolean);return t.status?e.filter(e=>e.status===t.status):t.withDrive?e.filter(t=>t.driveUrl):e}getWorkflowStatus(t){let e=this.pm.getProject(t);if(!e)throw Error(`Project not found: ${t}`);let r=null;if(e.description){let t=e.description.match(/\[BookMe(?: ID)?:\s*([^\]]+)\]/);if(t){let e=t[1].trim(),o=this.loadBook(e);o&&(r={id:o.id,chapters:o.metadata.chapterCount,words:o.metadata.wordCount,status:o.metadata.status})}}return{project:{id:e.id,title:e.title,driveUrl:e.driveUrl,hasFile:!!e.driveFileId},book:r?{id:r.id,chapters:r.chapters,words:r.words,status:r.status}:null,workflow:{step:r?"draft"===r.status?2:3:1,totalSteps:3,steps:[{step:1,name:"Create Project",done:!!e},{step:2,name:"Process Content",done:!!r},{step:3,name:"Export/Publish",done:r?.status==="published"}]}}}saveBook(t){let e=i.join(this.projectsDir,`${t.id}.json`);o.writeFileSync(e,JSON.stringify(t,null,2),"utf8")}loadBook(t){let e=i.join(this.projectsDir,`${t}.json`);return o.existsSync(e)?JSON.parse(o.readFileSync(e,"utf8")):null}ensureDir(t){o.existsSync(t)||o.mkdirSync(t,{recursive:!0})}}t.exports=c},6890:(t,e,r)=>{let{v4:o}=r(4770).randomUUID?{v4:()=>r(4770).randomUUID()}:{v4:()=>`${Date.now()}-${Math.random().toString(36).substr(2,9)}`};class i{static createBook(t={}){let{title:e="Untitled Book",author:r="Anonymous",description:o="",content:i="",driveUrl:n=null,driveFileId:s=null}=t,a=this.generateBookId(),l=new Date().toISOString(),d={id:a,title:e,author:r,description:o,driveUrl:n,driveFileId:s,cover:{title:e,author:r,subtitle:"",backgroundColor:"#1a1a2e",textColor:"#ffffff",imageUrl:null},metadata:{createdAt:l,updatedAt:l,wordCount:0,chapterCount:0,status:"draft"},chapters:[],tableOfContents:[],settings:{fontSize:14,fontFamily:"Georgia",lineHeight:1.6,theme:"light"}};return i&&this.processContent(d,i),d}static processContent(t,e){this.parseChapters(e).forEach((e,r)=>{let o={id:this.generateChapterId(),title:e.title||`Chapter ${r+1}`,number:r+1,sections:[],wordCount:0,status:"draft"},i=this.parseSections(e.content),n=0;i.forEach((t,e)=>{let r={id:this.generateSectionId(),title:t.title||"",content:t.content,wordCount:this.countWords(t.content),status:"draft"};n+=r.wordCount,o.sections.push(r)}),o.wordCount=n,t.chapters.push(o)}),t.metadata.chapterCount=t.chapters.length,t.metadata.wordCount=t.chapters.reduce((t,e)=>t+e.wordCount,0),this.generateTableOfContents(t)}static parseChapters(t){let e=[];for(let r of[/^#\s+Chapter\s+\d+:?\s+(.+)$/gm,/^##\s+(.+)$/gm,/^Capítulo\s+\d+:?\s+(.+)$/gm]){let o=[...t.matchAll(r)];if(o.length>0)return o.forEach((r,i)=>{let n=r.index,s=i<o.length-1?o[i+1].index:t.length,a=t.substring(n,s).trim(),l=a.indexOf("\n");a=-1!==l?a.substring(l+1).trim():"",e.push({title:r[1]?.trim()||`Chapter ${e.length+1}`,content:a})}),e}return[{title:"Chapter 1",content:t}]}static parseSections(t){let e=[],r=t.split("\n").filter(t=>t.trim()),o={title:"",content:[]};return r.forEach(t=>{t.startsWith("##")||t.startsWith("- ")?(o.content.length>0&&e.push({title:o.title,content:o.content.join("\n")}),o={title:t.replace(/^#+\s+/,"").replace(/^-\s+/,"").trim(),content:[]}):t.trim()&&o.content.push(t)}),o.content.length>0&&e.push({title:o.title,content:o.content.join("\n")}),e.length>0?e:[{title:"",content:t}]}static generateTableOfContents(t){t.tableOfContents=t.chapters.map((t,e)=>({chapterNumber:t.number,chapterTitle:t.title,sections:t.sections.map(t=>({title:t.title||`Section ${t.id.substring(0,4)}`,sectionId:t.id}))}))}static addChapter(t,e="",r=""){let o={id:this.generateChapterId(),title:e||`Chapter ${t.chapters.length+1}`,number:t.chapters.length+1,sections:[],wordCount:0,status:"draft"};if(r){let t=this.parseSections(r),e=0;t.forEach(t=>{let r={id:this.generateSectionId(),title:t.title||"",content:t.content,wordCount:this.countWords(t.content),status:"draft"};e+=r.wordCount,o.sections.push(r)}),o.wordCount=e}return t.chapters.push(o),t.metadata.chapterCount=t.chapters.length,t.metadata.wordCount+=o.wordCount,t.metadata.updatedAt=new Date().toISOString(),this.generateTableOfContents(t),o}static editChapter(t,e,r){let o=t.chapters.find(t=>t.id===e);if(!o)throw Error(`Chapter not found: ${e}`);if(r.title&&(o.title=r.title),void 0!==r.content){o.sections=[];let t=this.parseSections(r.content),e=0;t.forEach(t=>{let r={id:this.generateSectionId(),title:t.title||"",content:t.content,wordCount:this.countWords(t.content),status:"draft"};e+=r.wordCount,o.sections.push(r)}),o.wordCount=e}return t.metadata.updatedAt=new Date().toISOString(),this.generateTableOfContents(t),o}static editSection(t,e,r,o){let i=t.chapters.find(t=>t.id===e);if(!i)throw Error(`Chapter not found: ${e}`);let n=i.sections.find(t=>t.id===r);if(!n)throw Error(`Section not found: ${r}`);let s=n.wordCount;return o.title&&(n.title=o.title),o.content&&(n.content=o.content,n.wordCount=this.countWords(o.content),i.wordCount=i.wordCount-s+n.wordCount,t.metadata.wordCount=t.metadata.wordCount-s+n.wordCount),t.metadata.updatedAt=new Date().toISOString(),n}static deleteChapter(t,e){let r=t.chapters.findIndex(t=>t.id===e);if(-1===r)throw Error(`Chapter not found: ${e}`);let o=t.chapters[r];t.metadata.wordCount-=o.wordCount,t.chapters.splice(r,1),t.chapters.forEach((t,e)=>{t.number=e+1}),t.metadata.chapterCount=t.chapters.length,t.metadata.updatedAt=new Date().toISOString(),this.generateTableOfContents(t)}static getSummary(t){return{id:t.id,title:t.title,author:t.author,description:t.description,wordCount:t.metadata.wordCount,chapterCount:t.metadata.chapterCount,status:t.metadata.status,createdAt:t.metadata.createdAt,updatedAt:t.metadata.updatedAt}}static countWords(t){return t.trim().split(/\s+/).filter(t=>t.length>0).length}static generateBookId(){return`book_${Date.now()}_${Math.random().toString(36).substr(2,9)}`}static generateChapterId(){return`chap_${Date.now()}_${Math.random().toString(36).substr(2,9)}`}static generateSectionId(){return`sect_${Date.now()}_${Math.random().toString(36).substr(2,9)}`}}t.exports=i},3685:(t,e,r)=>{let o=r(6890),i=r(4407),n=r(9807);t.exports={BookProcessor:o,BookExporter:i,BookIntegrator:n}},1171:(t,e)=>{Object.defineProperty(e,"l",{enumerable:!0,get:function(){return function t(e,r){return r in e?e[r]:"then"in e&&"function"==typeof e.then?e.then(e=>t(e,r)):"function"==typeof e&&"default"===r?e:void 0}}})},2181:(t,e)=>{var r;Object.defineProperty(e,"x",{enumerable:!0,get:function(){return r}}),function(t){t.PAGES="PAGES",t.PAGES_API="PAGES_API",t.APP_PAGE="APP_PAGE",t.APP_ROUTE="APP_ROUTE"}(r||(r={}))},5762:(t,e,r)=>{t.exports=r(145)},6100:(t,e,r)=>{let o=r(5240),{URL:i}=r(7360),n=r(2441);class s{constructor(t={}){this.maxRetries=t.maxRetries||3,this.retryDelay=t.retryDelay||1e3,this.timeout=t.timeout||3e4,this.confirmationCookie=null}async download(t,e=null){let r=n.extractFileId(t);if(!r)throw Error(`Invalid Google Drive URL or File ID: ${t}`);return e||this._isGoogleNativeUrl(t)?this._downloadExport(t,e):this._downloadDirect(r)}async _downloadWithRetry(t,e=0){try{return await t()}catch(r){if(e<this.maxRetries&&this._isRetryableError(r)){let r=this.retryDelay*Math.pow(2,e);return await new Promise(t=>setTimeout(t,r)),this._downloadWithRetry(t,e+1)}throw r}}async _downloadDirect(t){return this._downloadWithRetry(async()=>{let e=`https://drive.google.com/uc?export=download&id=${t}`;return new Promise((r,i)=>{o.get(e,{timeout:this.timeout},e=>{if(303===e.statusCode&&e.headers.location){let t=e.headers.location;return this._followRedirect(t,r,i)}let o=e.headers["set-cookie"];if(o){let t=o[0]?.match(/download_warning=([^;]+)/);t&&(this.confirmationCookie=t[1])}if(200===e.statusCode&&this.confirmationCookie)return this._downloadWithCookie(t,r,i);if(200!==e.statusCode){i(Error(`HTTP ${e.statusCode} from Google Drive`));return}let n=[];e.on("data",t=>n.push(t)),e.on("end",()=>r(Buffer.concat(n))),e.on("error",i)}).on("error",i)})})}_followRedirect(t,e,r){o.get(t,{timeout:this.timeout},t=>{if(200!==t.statusCode){r(Error(`HTTP ${t.statusCode} on redirect`));return}let o=[];t.on("data",t=>o.push(t)),t.on("end",()=>e(Buffer.concat(o))),t.on("error",r)}).on("error",r)}async _downloadWithCookie(t,e,r){let i=`https://drive.google.com/uc?export=download&id=${t}&confirm=${this.confirmationCookie}`;o.get(i,{timeout:this.timeout},t=>{if(200!==t.statusCode){r(Error(`HTTP ${t.statusCode} with cookie`));return}let o=[];t.on("data",t=>o.push(t)),t.on("end",()=>e(Buffer.concat(o))),t.on("error",r)}).on("error",r)}async _downloadExport(t,e="pdf"){return this._downloadWithRetry(async()=>{let r=n.extractFileId(t);"string"==typeof t&&(t.includes("/spreadsheets/"),t.includes("/presentation/"));let i=n.getExportUrl(r,e);return new Promise((t,e)=>{o.get(i,{timeout:this.timeout},r=>{if(200!==r.statusCode){e(Error(`HTTP ${r.statusCode} on export`));return}let o=[];r.on("data",t=>o.push(t)),r.on("end",()=>t(Buffer.concat(o))),r.on("error",e)}).on("error",e)})})}_isGoogleNativeUrl(t){return"string"==typeof t&&(t.includes("/document/")||t.includes("/spreadsheets/")||t.includes("/presentation/"))}_isRetryableError(t){return!!t&&("ECONNRESET"===t.code||"ETIMEDOUT"===t.code||"ECONNREFUSED"===t.code||t.message?.includes("429")||t.message?.includes("503"))}async downloadBatch(t,e={}){let r={},o={};for(let i of t)try{r[i]=await this.download(i,e.format)}catch(t){o[i]=t.message}return{success:r,errors:o}}getFileInfo(t){let e=n.parseUrl(t);return{fileId:e.id,type:e.type,isNativeDocument:e.isDoc||e.isSheet||e.isSlide,availableFormats:e.isDoc?n.getExportFormats("document"):e.isSheet?n.getExportFormats("spreadsheet"):e.isSlide?n.getExportFormats("presentation"):[],directUrl:e.directUrl}}}t.exports=s},2441:t=>{class e{static extractFileId(t){if(!t)return null;let e=t.match(/\/d\/([a-zA-Z0-9-_]+)/);if(e)return e[1];let r=t.match(/[?&]id=([a-zA-Z0-9-_]+)/);return r?r[1]:/^[a-zA-Z0-9-_]{20,}$/.test(t)?t:null}static extractFolderId(t){if(!t)return null;let e=t.match(/\/folders\/([a-zA-Z0-9-_]+)/);if(e)return e[1];let r=t.match(/[?&]id=([a-zA-Z0-9-_]{20,})/);return r?r[1]:null}static getDirectDownloadUrl(t){let e=this.extractFileId(t);if(!e)throw Error(`Invalid Google Drive URL or File ID: ${t}`);return`https://drive.google.com/uc?export=download&id=${e}`}static getExportUrl(t,e="pdf"){let r=this.extractFileId(t);if(!r)throw Error(`Invalid Google Drive URL or File ID: ${t}`);let o="document";"string"==typeof t&&(t.includes("/spreadsheets/")&&(o="spreadsheets"),t.includes("/presentation/")&&(o="presentation"));let i=`https://docs.google.com/${o}/d/${r}/export`;return`${i}?format=${e}`}static getFolderUrl(t){let e=this.extractFolderId(t);if(!e)throw Error(`Invalid Google Drive Folder ID: ${t}`);return`https://drive.google.com/drive/folders/${e}?usp=sharing`}static parseUrl(t){if(!t)return{error:"URL required"};let e={originalUrl:t,type:null,id:null,isFolder:!1,isDoc:!1,isSheet:!1,isSlide:!1,directUrl:null};return t.includes("/folders/")?(e.type="folder",e.isFolder=!0,e.id=this.extractFolderId(t),e.directUrl=this.getFolderUrl(e.id)):t.includes("/spreadsheets/")?(e.type="spreadsheet",e.isSheet=!0,e.id=this.extractFileId(t),e.directUrl=this.getExportUrl(t,"csv")):t.includes("/presentation/")?(e.type="presentation",e.isSlide=!0,e.id=this.extractFileId(t),e.directUrl=this.getExportUrl(t,"pptx")):t.includes("/document/")?(e.type="document",e.isDoc=!0,e.id=this.extractFileId(t),e.directUrl=this.getExportUrl(t,"pdf")):(e.type="file",e.id=this.extractFileId(t),e.directUrl=this.getDirectDownloadUrl(t)),e}static isValidDriveUrl(t){return!!t&&"string"==typeof t&&(t.includes("drive.google.com")||t.includes("docs.google.com"))}static getExportFormats(t="document"){return({document:["pdf","docx","odt","rtf","txt","epub","zip"],spreadsheet:["csv","tsv","xlsx","ods","pdf","xls","zip"],presentation:["pptx","odp","pdf","txt","zip"]})[t]||[]}}t.exports=e},5075:(t,e,r)=>{let o=r(2441),i=r(6100);t.exports={DriveExtractor:o,DriveDownloader:i}},3836:(t,e,r)=>{let o=r(1452);t.exports={ProjectManager:o}},1452:(t,e,r)=>{let o=r(2048),i=r(5315),{DriveExtractor:n}=r(5075);class s{constructor(t="./projects"){this.projectsDir=t,this.ensureDir(t),this.projects=this.loadAll()}createProject(t={}){let e=this.generateId(),r=new Date().toISOString(),o={id:e,title:t.title||"",description:t.description||"",driveUrl:t.driveUrl||null,driveFileId:null,driveFileInfo:null,fileType:null,createdAt:r,updatedAt:r,files:[],metadata:{}};return this.projects.push(o),t.driveUrl?this.updateProject(e,{driveUrl:t.driveUrl}):this.save(o),o}updateProject(t,e){let r=this.getProject(t);if(!r)throw Error(`Project not found: ${t}`);let o=new Date().toISOString();if(Object.assign(r,e,{updatedAt:o}),e.driveUrl){let t=n.extractFileId(e.driveUrl),i=n.parseUrl(e.driveUrl);r.driveFileId=t,r.driveFileInfo=i,r.fileType=this.detectFileType(i.type),r.metadata={url:e.driveUrl,extractedAt:o,type:i.type,isNativeDocument:i.isDoc||i.isSheet||i.isSlide}}return this.save(r),r}getProject(t){return this.projects.find(e=>e.id===t)||null}listProjects(t={}){let e=[...this.projects];if(t.fileType&&(e=e.filter(e=>e.fileType===t.fileType)),t.hasDrive&&(e=e.filter(t=>null!==t.driveUrl)),t.search){let r=t.search.toLowerCase();e=e.filter(t=>t.title.toLowerCase().includes(r)||t.description.toLowerCase().includes(r))}return e.sort((t,e)=>new Date(e.updatedAt)-new Date(t.updatedAt))}deleteProject(t){let e=this.projects.findIndex(e=>e.id===t);if(-1===e)return!1;this.projects[e];let r=this.getFilePath(t);return this.projects.splice(e,1),o.existsSync(r)&&o.unlinkSync(r),!0}exportProject(t){let e=this.getProject(t);if(!e)throw Error(`Project not found: ${t}`);return JSON.stringify(e,null,2)}importProject(t){let e=JSON.parse(t);if(!e.id||!e.title)throw Error("Invalid project format: missing id or title");return this.save(e),this.projects.push(e),e}detectFileType(t){return({document:"document",spreadsheet:"spreadsheet",presentation:"presentation",file:"generic",folder:"folder"})[t]||"unknown"}save(t){let e=this.getFilePath(t.id),r=JSON.stringify(t,null,2);o.writeFileSync(e,r,"utf8")}loadAll(){if(!o.existsSync(this.projectsDir))return[];let t=o.readdirSync(this.projectsDir),e=[];return t.forEach(t=>{if(t.endsWith(".json"))try{let r=i.join(this.projectsDir,t),n=o.readFileSync(r,"utf8");e.push(JSON.parse(n))}catch(e){console.error(`Error loading project ${t}:`,e.message)}}),e}getFilePath(t){return i.join(this.projectsDir,`${t}.json`)}generateId(){return`proj_${Date.now()}_${Math.random().toString(36).substr(2,9)}`}ensureDir(t){o.existsSync(t)||o.mkdirSync(t,{recursive:!0})}getStats(){return{totalProjects:this.projects.length,withDriveUrl:this.projects.filter(t=>t.driveUrl).length,byFileType:this.projects.reduce((t,e)=>(t[e.fileType||"unknown"]=(t[e.fileType||"unknown"]||0)+1,t),{}),lastModified:this.projects.length>0?new Date(Math.max(...this.projects.map(t=>new Date(t.updatedAt)))):null}}watch(t,e){let r;let i=this.getFilePath(t),n=o.watch(i,()=>{clearTimeout(r),r=setTimeout(()=>{e(this.getProject(t))},300)});return()=>n.close()}}t.exports=s}};