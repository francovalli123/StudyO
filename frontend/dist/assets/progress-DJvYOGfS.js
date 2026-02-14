import"./modulepreload-polyfill-B5Qt9EMX.js";import{g as z,a as W,i as G,b as I}from"./auth-gate-B8HnkSQA.js";import{t as Y,g as H,b as Z}from"./responsive-DwadFwRg.js";document.addEventListener("DOMContentLoaded",async function(){try{await z()}catch(s){console.error("Error al cargar información del usuario:",s),(s.message==="No autenticado"||s.message==="Sesión expirada")&&(window.location.href="/login")}const n=document.getElementById("logoutBtn");n&&n.addEventListener("click",async s=>{s.preventDefault();try{await W(),window.location.href="/"}catch(o){console.error("Error al cerrar sesión:",o),window.location.href="/"}})});G({loginPath:"/login"});const O=typeof window<"u"&&(window.matchMedia?.("(hover: none), (pointer: coarse)").matches||navigator.maxTouchPoints>0);function R(n){if(n<60)return`${n}m`;const s=Math.floor(n/60),o=n%60;return o===0?`${s}h`:`${s}h ${o}m`}function B(n){return n===0?"#1f2937":n<1?"#6b21a8":n<2?"#7c3aed":n<4?"#a855f7":"#c084fc"}async function V(){const n=await z();n.timezone;try{const s=await I("/pomodoro/"),o=Y(),h=H(),y=new Date,x=new Date(y.toLocaleString("en-US",{timeZone:n.timezone})),w=new Date(x);w.setMonth(w.getMonth()-6),w.setDate(1),w.setHours(0,0,0,0);const E=s.filter(e=>new Date(new Date(e.start_time).toLocaleString("en-US",{timeZone:n.timezone}))>=w),C={};E.forEach(e=>{const r=new Date(new Date(e.start_time).toLocaleString("en-US",{timeZone:n.timezone})),i=`${r.getFullYear()}-${String(r.getMonth()+1).padStart(2,"0")}`;C[i]=(C[i]||0)+e.duration/60});const L=Object.keys(C).sort(),l=[],m=[];L.forEach(e=>{const[r,i]=e.split("-"),S=new Date(parseInt(r),parseInt(i)-1,1).toLocaleDateString(h,{month:"short"}),D=S.charAt(0).toUpperCase()+S.slice(1);l.push(D),m.push(C[e])});const b=document.getElementById("monthly-rhythm-chart-container"),u=document.getElementById("monthly-rhythm-chart");if(!b||!u)return;if(m.length===0||E.length===0){const e=Z[H()];b.innerHTML=`
                <div class="flex flex-col items-center justify-center h-full py-12">
                    <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-purple-500/20 flex items-center justify-center mb-4" style="box-shadow: 0 0 0 1px rgba(168,85,247,0.3);">
                        <i data-lucide="trending-up" class="w-8 h-8 text-purple-400"></i>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-2">${e.progress.monthlyRhythm}</h3>
                    <p class="text-gray-400 text-sm text-center max-w-xs">${e.progress.monthlyRhythmDesc}</p>
                </div>
            `,typeof lucide<"u"&&lucide.createIcons();return}const g=b.clientWidth-40,p=240,a={top:20,right:20,bottom:40,left:50},f=g-a.left-a.right,t=p-a.top-a.bottom,d=Math.max(...m,1),$=f/Math.max(1,m.length-1);let M="";const c=[];m.forEach((e,r)=>{const i=a.left+r*$,v=a.top+t-e/d*t;c.push({x:i,y:v})});let j="",U="";if(c.length>1){U=`M ${c[0].x} ${c[0].y}`,j=`M ${c[0].x} ${c[0].y}`;for(let i=1;i<c.length;i++){const v=c[i-1],S=c[i],D=v.x+(S.x-v.x)*.4,T=v.y,k=S.x-(S.x-v.x)*.4,_=S.y,A=` C ${D} ${T}, ${k} ${_}, ${S.x} ${S.y}`;U+=A,j+=A}const e=c[c.length-1],r=c[0];j+=` L ${e.x} ${a.top+t}`,j+=` L ${r.x} ${a.top+t}`,j+=" Z",M=j}u.setAttribute("width",g.toString()),u.setAttribute("height",p.toString()),u.setAttribute("viewBox",`0 0 ${g} ${p}`),u.innerHTML=`
            <!-- Grid lines -->
            ${Array.from({length:5},(e,r)=>{const i=a.top+t/4*r;return`<line x1="${a.left}" y1="${i}" x2="${a.left+f}" y2="${i}" stroke="#1e212b" stroke-width="1" />`}).join("")}
            
            <!-- Area fill with gradient -->
            <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#a855f7" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="#a855f7" stop-opacity="0.05"/>
                </linearGradient>
            </defs>
            <path d="${M}" fill="url(#lineGradient)" />
            
            <!-- Line (smooth curve) -->
            <path d="${U}" 
                  fill="none" 
                  stroke="#a855f7" 
                  stroke-width="3" 
                  stroke-linecap="round" 
                  stroke-linejoin="round" />
            
            <!-- Data points -->
            ${c.map((e,r)=>{const i=m[r];return`
                    <g>
                        <circle cx="${e.x}" cy="${e.y}" r="5" fill="#1e212b" stroke="#a855f7" stroke-width="2" 
                                class="cursor-pointer hover:r-7 transition-all" 
                                data-month="${l[r]}" 
                                data-hours="${i.toFixed(1)}"/>
                        <title>${l[r]}: ${i.toFixed(1)}h</title>
                    </g>
                `}).join("")}
            
            <!-- X-axis labels -->
            ${l.map((e,r)=>`<text x="${a.left+r*$}" y="${p-10}" text-anchor="middle" fill="#6b7280" font-size="10">${e}</text>`).join("")}
            
            <!-- Y-axis labels -->
            ${Array.from({length:5},(e,r)=>{const i=a.top+t/4*(4-r),v=d/4*r;return`<text x="${a.left-10}" y="${i+4}" text-anchor="end" fill="#6b7280" font-size="10">${v.toFixed(1)}h</text>`}).join("")}
        `,O||u.querySelectorAll("circle").forEach((r,i)=>{const v=m[i],S=l[i];r.addEventListener("mouseenter",D=>{const T=D,k=document.createElement("div");k.id="rhythm-tooltip",k.className="fixed bg-dark-card border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white shadow-lg z-50 pointer-events-none",k.innerHTML=`
                        <div class="font-bold text-purple-400">${S}</div>
                        <div class="text-gray-300">${v.toFixed(1)} ${o.progress.hours}</div>
                    `,document.body.appendChild(k),P(k,T.clientX,T.clientY)}),r.addEventListener("mouseleave",()=>{const D=document.getElementById("rhythm-tooltip");D&&D.remove()}),r.addEventListener("mousemove",D=>{const T=D,k=document.getElementById("rhythm-tooltip");k&&P(k,T.clientX,T.clientY)})})}catch(s){console.error("Error loading monthly rhythm:",s)}}function X(n,s){new Date(n.toLocaleString("en-US",{timeZone:"UTC"}));const h=new Date(n.toLocaleString("en-US",{timeZone:s})).getDay();return h===0?7:h}async function q(){const n=await z();try{const s=await I("/pomodoro/"),o=new Date,h=n.timezone??"UTC",y=X(o,h),x=new Date(o),w=y-1;x.setDate(o.getDate()-w),x.setHours(0,0,0,0);const E=new Set;s.forEach(g=>{const p=new Date(g.start_time),f=new Intl.DateTimeFormat("en-US",{timeZone:h,year:"numeric",month:"2-digit",day:"2-digit"}).format(p),t=new Date(f);t>=x&&t<=o&&E.add(f)});const C=Math.floor((o.getTime()-x.getTime())/(1e3*60*60*24))+1,L=Math.round(E.size/7*100),l=document.querySelector(".bg-dark-card.animate-on-load.delay-400"),m=document.getElementById("consistency-progress-circle"),b=document.getElementById("consistency-percentage"),u=document.getElementById("consistency-feedback");if(m){const g=2*Math.PI*70,p=g-L/100*g;m.setAttribute("stroke-dashoffset",p.toString())}if(b&&(b.textContent=`${L}%`),u){const g=H(),p={es:["¡Excelente constancia!","Muy buena constancia","Buen ritmo, sigue así","Puedes mejorar tu constancia","Intenta estudiar más días"],en:["Excellent consistency!","Very good consistency","Good pace, keep it up","You can improve your consistency","Try to study more days"],zh:["极佳的坚持！","非常好的坚持","节奏不错，继续保持","可以提升坚持度","尝试更多天学习"],pt:["Consistência excelente!","Muito boa consistência","Bom ritmo, continue assim","Você pode melhorar a constância","Tente estudar mais dias"]},a=p[g]||p.es;let f="";L>=85?f=a[0]:L>=70?f=a[1]:L>=50?f=a[2]:L>=30?f=a[3]:f=a[4],u.textContent=f}}catch(s){console.error("Error loading weekly consistency:",s)}}async function K(){const n=Y(),s=await z();try{let o=function(t,d){const $=new Date(t.toLocaleString("en-US",{timeZone:d}));return{year:$.getFullYear(),month:$.getMonth(),day:$.getDate()}};const h=await I("/pomodoro/"),y=await I("/subjects/"),x=s.timezone??"UTC",w=new Date,{year:E,month:C}=o(w,x),L=h.filter(t=>{if(!t||!t.start_time||typeof t.duration!="number")return!1;const d=new Date(t.start_time);if(isNaN(d.getTime()))return!1;const{year:$,month:M}=o(d,x);return $===E&&M===C}),l={};let m=0;L.forEach(t=>{let d=null;t.subject!==null&&t.subject!==void 0&&(d=typeof t.subject=="string"?parseInt(t.subject):t.subject);const $=d!==null&&!isNaN(d)?d:-1;l[$]||(l[$]=0),l[$]+=t.duration,m+=t.duration});const b=y.filter(t=>l[t.id]&&l[t.id]>0).map(t=>({id:t.id,name:t.name,minutes:l[t.id],percentage:m>0?l[t.id]/m*100:0})).sort((t,d)=>d.minutes-t.minutes);l[-1]&&l[-1]>0&&b.push({id:-1,name:n.dashboard.focusDistributionNoSubject,minutes:l[-1],percentage:m>0?l[-1]/m*100:0});const u=["#a855f7","#60a5fa","#34d399","#fbbf24","#ec4899","#8b5cf6","#f97316","#06b6d4"];let g="",p=0;b.forEach((t,d)=>{const $=t.id===-1?"#4b5563":u[d%u.length],M=p,c=p+t.percentage;g+=`${$} ${M}% ${c}%, `,p=c});const a=document.getElementById("focus-distribution-donut"),f=a?.parentElement;if(a&&f){if(L.length===0||b.length===0){f.innerHTML=`
                    <div class="flex flex-col items-center justify-center h-full py-12">
                        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-purple-500/20 flex items-center justify-center mb-4" style="box-shadow: 0 0 0 1px rgba(168,85,247,0.3);">
                            <i data-lucide="pie-chart" class="w-8 h-8 text-purple-400"></i>
                        </div>
                        <h3 class="text-lg font-bold text-white mb-2">${n.progress.monthlyFocus}</h3>
                        <p class="text-gray-400 text-sm text-center max-w-xs">${n.progress.monthlyFocusDesc}</p>
                    </div>
                `,typeof lucide<"u"&&lucide.createIcons();return}a.style.background=`conic-gradient(${g.slice(0,-2)})`;const t=document.getElementById("focus-total-hours-month");t&&(t.textContent=R(m));const d=document.getElementById("focus-legend-month");d&&(d.innerHTML=b.map(($,M)=>`
                        <div class="flex items-center gap-1">
                            <span class="w-2 h-2 rounded-full" style="background-color: ${$.id===-1?"#4b5563":u[M%u.length]}"></span>
                            <span class="text-xs text-gray-400">${$.name}</span>
                        </div>
                    `).join(""))}}catch(o){console.error("Error loading monthly focus distribution:",o)}}async function Q(){const n=await z();try{let s=function(l,m){const b=new Date(l.toLocaleString("en-US",{timeZone:m}));return{year:b.getFullYear(),month:b.getMonth(),day:b.getDate()}},o=function(l,m){if(O)return;l.querySelectorAll(".heatmap-cell").forEach(u=>{u.addEventListener("mouseenter",g=>{const p=g;let a=document.getElementById("heatmap-tooltip");a||(a=document.createElement("div"),a.id="heatmap-tooltip",a.className="fixed bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-xs text-white shadow-xl z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-8px]",document.body.appendChild(a));const f=u.getAttribute("data-date"),t=u.getAttribute("data-hours");if(f){const d=new Date(f),$=new Date(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()),M=m==="en"?"en-US":m==="pt"?"pt-BR":m==="zh"?"zh-CN":"es-AR",c=$.toLocaleDateString(M,{day:"numeric",month:"long",year:"numeric"}),j=parseFloat(t||"0"),U=Y();a.innerHTML=`<span class="font-semibold text-white">${j>0?j.toFixed(1)+" "+U.progress.hours:U.progress.noStudy}</span> <span class="text-gray-400"> ${U.progress.on} ${c}</span>`,P(a,p.clientX,p.clientY)}}),u.addEventListener("mouseleave",()=>{const g=document.getElementById("heatmap-tooltip");g&&g.remove()}),u.addEventListener("mousemove",g=>{const p=document.getElementById("heatmap-tooltip");p&&P(p,g.clientX,g.clientY)})})};const h=await I("/pomodoro/"),y=n.timezone??"UTC",x=document.getElementById("heatmap-container"),w=document.getElementById("heatmap-total");if(w&&(w.style.display="none"),!x)return;const E=new Date,{year:C}=s(E,y);(l=>{const m=new Date(Date.UTC(l,0,1,0,0,0)),b=new Date(Date.UTC(l,11,31,23,59,59)),u={};h.forEach(e=>{if(!e||!e.start_time||typeof e.duration!="number")return;const r=new Date(e.start_time),{year:i,month:v,day:S}=s(r,y);if(i!==l)return;const D=`${i}-${String(v+1).padStart(2,"0")}-${String(S).padStart(2,"0")}`;u[D]||(u[D]=0),u[D]+=e.duration/60});const g=Object.values(u).filter(e=>e>0).length,p=H(),a={es:{title:"días con estudio en el año",mon:"Lun",wed:"Mié",fri:"Vie",less:"Menos",more:"Más"},en:{title:"days with study in the year",mon:"Mon",wed:"Wed",fri:"Fri",less:"Less",more:"More"},pt:{title:"dias com estudo no ano",mon:"Seg",wed:"Qua",fri:"Sex",less:"Menos",more:"Mais"},zh:{title:"天有学习记录",mon:"一",wed:"三",fri:"五",less:"少",more:"多"}},f=a[p]||a.es,t=[];let d=new Date(m);const $=d.getUTCDay();for(d.setUTCDate(d.getUTCDate()-$);d<=b||t.length<53;){const e=[];for(let r=0;r<7;r++)e.push(new Date(d)),d.setUTCDate(d.getUTCDate()+1);if(t.push(e),e[0]>b)break}const M=[];t.forEach((e,r)=>{const i=e.find(v=>v.getUTCDate()===1&&v.getUTCFullYear()===l);if(i){const v=i.toLocaleDateString(p==="es"?"es-AR":p,{month:"short"});M.push({name:v,weekIdx:r})}});let c='<div class="flex flex-col gap-1 w-full min-w-max">';c+='<div class="flex gap-[2px] text-[10px] text-gray-400 mb-1 pl-8">',t.forEach((e,r)=>{const i=M.find(v=>v.weekIdx===r);c+=`<div style="width: 10px; overflow:visible; white-space:nowrap;">${i?i.name:""}</div>`}),c+="</div>",c+='<div class="flex items-start">',c+='<div class="flex flex-col gap-[3px] pr-2 text-[10px] text-gray-500 pt-[14px] flex-shrink-0 sticky left-0 z-10">',["",f.mon,"",f.wed,"",f.fri,""].forEach(e=>{c+=`<div style="height: 10px; line-height: 10px;">${e}</div>`}),c+="</div>",c+='<div class="flex gap-[2px]">',t.forEach(e=>{c+='<div class="flex flex-col gap-[2px]">',e.forEach(r=>{const{year:i,month:v,day:S}=s(r,y),D=i===l,T=`${i}-${String(v+1).padStart(2,"0")}-${String(S).padStart(2,"0")}`,k=D&&u[T]?u[T]:0;let _=D?B(k):"rgba(255,255,255,0.03)";k===0&&D&&(_="rgba(255,255,255,0.08)");const A=r.toLocaleDateString("es-AR",{day:"numeric",month:"long",year:"numeric"});c+=`
                        <div class="heatmap-cell rounded-[2px]" 
                             style="width: 10px; height: 10px; background-color: ${_};"
                             data-date="${T}"
                             data-hours="${k.toFixed(1)}"
                             title="${A}: ${k.toFixed(1)}h">
                        </div>
                    `}),c+="</div>"}),c+="</div></div></div>";const U=`
                <div class="flex flex-col w-full">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-white font-semibold text-sm">
                            ${g} ${f.title}
                        </h3>
                    </div>

                    <div class="w-full overflow-x-auto pb-2">
                            ${c}
                    </div>

                    <div class="flex items-center justify-between mt-3 text-xs text-gray-500">
                        <div class="flex items-center gap-1">
                            <span>${f.less}</span>
                            <div style="width:10px; height:10px; background-color: rgba(255,255,255,0.08);" class="rounded-[2px]"></div>
                            <div style="width:10px; height:10px; background-color: ${B(.5)};" class="rounded-[2px]"></div>
                            <div style="width:10px; height:10px; background-color: ${B(2)};" class="rounded-[2px]"></div>
                            <div style="width:10px; height:10px; background-color: ${B(4)};" class="rounded-[2px]"></div>
                            <div style="width:10px; height:10px; background-color: ${B(8)};" class="rounded-[2px]"></div>
                            <span>${f.more}</span>
                        </div>
                    </div>
                </div>
            `;x.innerHTML=U,o(x,p)})(C)}catch(s){console.error("Error loading study heatmap:",s)}}function P(n,s,o){const h=n.getBoundingClientRect(),y=15;let x=s+y,w=o-h.height-y;x+h.width>window.innerWidth-10&&(x=s-h.width-y),x<10&&(x=10),w<10&&(w=o+y),w+h.height>window.innerHeight-10&&(w=window.innerHeight-h.height-10),n.style.left=`${x}px`,n.style.top=`${w}px`}async function F(){const n=Y(),s=H();try{console.log("Loading weekly objectives stats...");const o=await I("/weekly-objectives/stats/");console.log("Weekly objectives stats loaded:",o);const h=document.getElementById("weekly-objectives-total"),y=document.getElementById("weekly-objectives-completed"),x=document.getElementById("weekly-objectives-rate");h&&(h.textContent=o.total_objectives.toString()),y&&(y.textContent=o.completed_objectives.toString()),x&&(x.textContent=`${o.completion_rate}%`);const w=document.getElementById("weekly-objectives-history");w&&(o.weekly_stats.length===0?w.innerHTML=`
                    <div class="text-center text-gray-500 text-sm py-4">
                        ${n.progress.emptyWeeklyObjectiveStats}
                    </div>
                `:w.innerHTML=o.weekly_stats.map(E=>{const C=new Date(E.week_start),L=new Date(E.week_end),l=C.toLocaleDateString(s,{day:"numeric",month:"short"}),m=L.toLocaleDateString(s,{day:"numeric",month:"short"}),b=l.charAt(0).toUpperCase()+l.slice(1),u=m.charAt(0).toUpperCase()+m.slice(1);return`
                    <div class="flex justify-between items-center bg-dark-input rounded-lg p-3">
                        <div class="text-sm text-gray-300">
                            ${b} - ${u}
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-xs text-gray-400">${E.completed}/${E.total}</span>
                            <div class="w-16 bg-gray-700 rounded-full h-2">
                                <div class="bg-purple-500 h-2 rounded-full transition-all duration-300"
                                     style="width: ${E.completion_rate}%"></div>
                            </div>
                            <span class="text-xs font-medium text-purple-400">${E.completion_rate.toFixed(0)}%</span>
                        </div>
                    </div>
                `}).join(""))}catch(o){console.error("Error loading weekly objectives stats:",o);const h=document.getElementById("weekly-objectives-history");if(h){const y="Error al cargar estadísticas";h.innerHTML=`
                <div class="text-center text-gray-500 text-sm py-4">
                    ${y}: ${o}
                </div>
            `}}}function J(n){const s=new Date,o=new Date(s.toLocaleString("en-US",{timeZone:n})),h=new Date(o);h.setHours(24,0,0,0);const y=h.getTime()-o.getTime();console.log(`Scheduling weekly stats in ${y} ms`),setTimeout(()=>{F(),setInterval(F,10080*60*1e3)},y)}(async function(){try{const o=(await z()).timezone??"UTC";J(o),await F()}catch(s){console.error("Error initializing weekly stats:",s),await F()}})();async function N(){try{await Promise.all([V(),q(),K(),Q(),F()])}catch(n){console.error("Error loading progress:",n)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",N):N();
