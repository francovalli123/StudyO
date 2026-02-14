import"./modulepreload-polyfill-B5Qt9EMX.js";import{g as z,a as O,i as G,b as I}from"./auth-gate-BVWKmKT_.js";import{t as Y,g as H,b as Z}from"./responsive-BEQ_P_Nu.js";document.addEventListener("DOMContentLoaded",async function(){try{await z()}catch(o){console.error("Error al cargar información del usuario:",o),(o.message==="No autenticado"||o.message==="Sesión expirada")&&(window.location.href="/login")}const e=document.getElementById("logoutBtn");e&&e.addEventListener("click",async o=>{o.preventDefault();try{await O(),window.location.href="/"}catch(n){console.error("Error al cerrar sesión:",n),window.location.href="/"}})});G({loginPath:"/login"});function R(e){if(e<60)return`${e}m`;const o=Math.floor(e/60),n=e%60;return n===0?`${o}h`:`${o}h ${n}m`}function B(e){return e===0?"#1f2937":e<1?"#6b21a8":e<2?"#7c3aed":e<4?"#a855f7":"#c084fc"}async function V(){const e=await z();e.timezone;try{const o=await I("/pomodoro/"),n=Y(),h=H(),x=new Date,w=new Date(x.toLocaleString("en-US",{timeZone:e.timezone})),v=new Date(w);v.setMonth(v.getMonth()-6),v.setDate(1),v.setHours(0,0,0,0);const E=o.filter(s=>new Date(new Date(s.start_time).toLocaleString("en-US",{timeZone:e.timezone}))>=v),T={};E.forEach(s=>{const r=new Date(new Date(s.start_time).toLocaleString("en-US",{timeZone:e.timezone})),c=`${r.getFullYear()}-${String(r.getMonth()+1).padStart(2,"0")}`;T[c]=(T[c]||0)+s.duration/60});const L=Object.keys(T).sort(),l=[],m=[];L.forEach(s=>{const[r,c]=s.split("-"),g=new Date(parseInt(r),parseInt(c)-1,1).toLocaleDateString(h,{month:"short"}),C=g.charAt(0).toUpperCase()+g.slice(1);l.push(C),m.push(T[s])});const b=document.getElementById("monthly-rhythm-chart-container"),u=document.getElementById("monthly-rhythm-chart");if(!b||!u)return;if(m.length===0||E.length===0){const s=Z[H()];b.innerHTML=`
                <div class="flex flex-col items-center justify-center h-full py-12">
                    <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-purple-500/20 flex items-center justify-center mb-4" style="box-shadow: 0 0 0 1px rgba(168,85,247,0.3);">
                        <i data-lucide="trending-up" class="w-8 h-8 text-purple-400"></i>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-2">${s.progress.monthlyRhythm}</h3>
                    <p class="text-gray-400 text-sm text-center max-w-xs">${s.progress.monthlyRhythmDesc}</p>
                </div>
            `,typeof lucide<"u"&&lucide.createIcons();return}const y=b.clientWidth-40,p=240,a={top:20,right:20,bottom:40,left:50},f=y-a.left-a.right,t=p-a.top-a.bottom,d=Math.max(...m,1),$=f/Math.max(1,m.length-1);let M="";const i=[];m.forEach((s,r)=>{const c=a.left+r*$,S=a.top+t-s/d*t;i.push({x:c,y:S})});let j="",U="";if(i.length>1){U=`M ${i[0].x} ${i[0].y}`,j=`M ${i[0].x} ${i[0].y}`;for(let c=1;c<i.length;c++){const S=i[c-1],g=i[c],C=S.x+(g.x-S.x)*.4,k=S.y,A=g.x-(g.x-S.x)*.4,N=g.y,P=` C ${C} ${k}, ${A} ${N}, ${g.x} ${g.y}`;U+=P,j+=P}const s=i[i.length-1],r=i[0];j+=` L ${s.x} ${a.top+t}`,j+=` L ${r.x} ${a.top+t}`,j+=" Z",M=j}u.setAttribute("width",y.toString()),u.setAttribute("height",p.toString()),u.setAttribute("viewBox",`0 0 ${y} ${p}`),u.innerHTML=`
            <!-- Grid lines -->
            ${Array.from({length:5},(s,r)=>{const c=a.top+t/4*r;return`<line x1="${a.left}" y1="${c}" x2="${a.left+f}" y2="${c}" stroke="#1e212b" stroke-width="1" />`}).join("")}
            
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
            ${i.map((s,r)=>{const c=m[r];return`
                    <g>
                        <circle cx="${s.x}" cy="${s.y}" r="5" fill="#1e212b" stroke="#a855f7" stroke-width="2" 
                                class="cursor-pointer hover:r-7 transition-all" 
                                data-month="${l[r]}" 
                                data-hours="${c.toFixed(1)}"/>
                        <title>${l[r]}: ${c.toFixed(1)}h</title>
                    </g>
                `}).join("")}
            
            <!-- X-axis labels -->
            ${l.map((s,r)=>`<text x="${a.left+r*$}" y="${p-10}" text-anchor="middle" fill="#6b7280" font-size="10">${s}</text>`).join("")}
            
            <!-- Y-axis labels -->
            ${Array.from({length:5},(s,r)=>{const c=a.top+t/4*(4-r),S=d/4*r;return`<text x="${a.left-10}" y="${c+4}" text-anchor="end" fill="#6b7280" font-size="10">${S.toFixed(1)}h</text>`}).join("")}
        `,u.querySelectorAll("circle").forEach((s,r)=>{const c=m[r],S=l[r];s.addEventListener("mouseenter",g=>{const C=g,k=document.createElement("div");k.id="rhythm-tooltip",k.className="fixed bg-dark-card border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white shadow-lg z-50 pointer-events-none",k.innerHTML=`
                    <div class="font-bold text-purple-400">${S}</div>
                    <div class="text-gray-300">${c.toFixed(1)} ${n.progress.hours}</div>
                `,document.body.appendChild(k),_(k,C.clientX,C.clientY)}),s.addEventListener("mouseleave",()=>{const g=document.getElementById("rhythm-tooltip");g&&g.remove()}),s.addEventListener("mousemove",g=>{const C=g,k=document.getElementById("rhythm-tooltip");k&&_(k,C.clientX,C.clientY)})})}catch(o){console.error("Error loading monthly rhythm:",o)}}function X(e,o){new Date(e.toLocaleString("en-US",{timeZone:"UTC"}));const h=new Date(e.toLocaleString("en-US",{timeZone:o})).getDay();return h===0?7:h}async function q(){const e=await z();try{const o=await I("/pomodoro/"),n=new Date,h=e.timezone??"UTC",x=X(n,h),w=new Date(n),v=x-1;w.setDate(n.getDate()-v),w.setHours(0,0,0,0);const E=new Set;o.forEach(y=>{const p=new Date(y.start_time),f=new Intl.DateTimeFormat("en-US",{timeZone:h,year:"numeric",month:"2-digit",day:"2-digit"}).format(p),t=new Date(f);t>=w&&t<=n&&E.add(f)});const T=Math.floor((n.getTime()-w.getTime())/(1e3*60*60*24))+1,L=Math.round(E.size/7*100),l=document.querySelector(".bg-dark-card.animate-on-load.delay-400"),m=document.getElementById("consistency-progress-circle"),b=document.getElementById("consistency-percentage"),u=document.getElementById("consistency-feedback");if(m){const y=2*Math.PI*70,p=y-L/100*y;m.setAttribute("stroke-dashoffset",p.toString())}if(b&&(b.textContent=`${L}%`),u){const y=H(),p={es:["¡Excelente constancia!","Muy buena constancia","Buen ritmo, sigue así","Puedes mejorar tu constancia","Intenta estudiar más días"],en:["Excellent consistency!","Very good consistency","Good pace, keep it up","You can improve your consistency","Try to study more days"],zh:["极佳的坚持！","非常好的坚持","节奏不错，继续保持","可以提升坚持度","尝试更多天学习"],pt:["Consistência excelente!","Muito boa consistência","Bom ritmo, continue assim","Você pode melhorar a constância","Tente estudar mais dias"]},a=p[y]||p.es;let f="";L>=85?f=a[0]:L>=70?f=a[1]:L>=50?f=a[2]:L>=30?f=a[3]:f=a[4],u.textContent=f}}catch(o){console.error("Error loading weekly consistency:",o)}}async function K(){const e=Y(),o=await z();try{let n=function(t,d){const $=new Date(t.toLocaleString("en-US",{timeZone:d}));return{year:$.getFullYear(),month:$.getMonth(),day:$.getDate()}};const h=await I("/pomodoro/"),x=await I("/subjects/"),w=o.timezone??"UTC",v=new Date,{year:E,month:T}=n(v,w),L=h.filter(t=>{if(!t||!t.start_time||typeof t.duration!="number")return!1;const d=new Date(t.start_time);if(isNaN(d.getTime()))return!1;const{year:$,month:M}=n(d,w);return $===E&&M===T}),l={};let m=0;L.forEach(t=>{let d=null;t.subject!==null&&t.subject!==void 0&&(d=typeof t.subject=="string"?parseInt(t.subject):t.subject);const $=d!==null&&!isNaN(d)?d:-1;l[$]||(l[$]=0),l[$]+=t.duration,m+=t.duration});const b=x.filter(t=>l[t.id]&&l[t.id]>0).map(t=>({id:t.id,name:t.name,minutes:l[t.id],percentage:m>0?l[t.id]/m*100:0})).sort((t,d)=>d.minutes-t.minutes);l[-1]&&l[-1]>0&&b.push({id:-1,name:e.dashboard.focusDistributionNoSubject,minutes:l[-1],percentage:m>0?l[-1]/m*100:0});const u=["#a855f7","#60a5fa","#34d399","#fbbf24","#ec4899","#8b5cf6","#f97316","#06b6d4"];let y="",p=0;b.forEach((t,d)=>{const $=t.id===-1?"#4b5563":u[d%u.length],M=p,i=p+t.percentage;y+=`${$} ${M}% ${i}%, `,p=i});const a=document.getElementById("focus-distribution-donut"),f=a?.parentElement;if(a&&f){if(L.length===0||b.length===0){f.innerHTML=`
                    <div class="flex flex-col items-center justify-center h-full py-12">
                        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-purple-500/20 flex items-center justify-center mb-4" style="box-shadow: 0 0 0 1px rgba(168,85,247,0.3);">
                            <i data-lucide="pie-chart" class="w-8 h-8 text-purple-400"></i>
                        </div>
                        <h3 class="text-lg font-bold text-white mb-2">${e.progress.monthlyFocus}</h3>
                        <p class="text-gray-400 text-sm text-center max-w-xs">${e.progress.monthlyFocusDesc}</p>
                    </div>
                `,typeof lucide<"u"&&lucide.createIcons();return}a.style.background=`conic-gradient(${y.slice(0,-2)})`;const t=document.getElementById("focus-total-hours-month");t&&(t.textContent=R(m));const d=document.getElementById("focus-legend-month");d&&(d.innerHTML=b.map(($,M)=>`
                        <div class="flex items-center gap-1">
                            <span class="w-2 h-2 rounded-full" style="background-color: ${$.id===-1?"#4b5563":u[M%u.length]}"></span>
                            <span class="text-xs text-gray-400">${$.name}</span>
                        </div>
                    `).join(""))}}catch(n){console.error("Error loading monthly focus distribution:",n)}}async function Q(){const e=await z();try{let o=function(l,m){const b=new Date(l.toLocaleString("en-US",{timeZone:m}));return{year:b.getFullYear(),month:b.getMonth(),day:b.getDate()}},n=function(l,m){l.querySelectorAll(".heatmap-cell").forEach(u=>{u.addEventListener("mouseenter",y=>{const p=y;let a=document.getElementById("heatmap-tooltip");a||(a=document.createElement("div"),a.id="heatmap-tooltip",a.className="fixed bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-xs text-white shadow-xl z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-8px]",document.body.appendChild(a));const f=u.getAttribute("data-date"),t=u.getAttribute("data-hours");if(f){const d=new Date(f),$=new Date(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()),M=m==="en"?"en-US":m==="pt"?"pt-BR":m==="zh"?"zh-CN":"es-AR",i=$.toLocaleDateString(M,{day:"numeric",month:"long",year:"numeric"}),j=parseFloat(t||"0"),U=Y();a.innerHTML=`<span class="font-semibold text-white">${j>0?j.toFixed(1)+" "+U.progress.hours:U.progress.noStudy}</span> <span class="text-gray-400"> ${U.progress.on} ${i}</span>`,_(a,p.clientX,p.clientY)}}),u.addEventListener("mouseleave",()=>{const y=document.getElementById("heatmap-tooltip");y&&y.remove()}),u.addEventListener("mousemove",y=>{const p=document.getElementById("heatmap-tooltip");p&&_(p,y.clientX,y.clientY)})})};const h=await I("/pomodoro/"),x=e.timezone??"UTC",w=document.getElementById("heatmap-container"),v=document.getElementById("heatmap-total");if(v&&(v.style.display="none"),!w)return;const E=new Date,{year:T}=o(E,x);(l=>{const m=new Date(Date.UTC(l,0,1,0,0,0)),b=new Date(Date.UTC(l,11,31,23,59,59)),u={};h.forEach(D=>{if(!D||!D.start_time||typeof D.duration!="number")return;const s=new Date(D.start_time),{year:r,month:c,day:S}=o(s,x);if(r!==l)return;const g=`${r}-${String(c+1).padStart(2,"0")}-${String(S).padStart(2,"0")}`;u[g]||(u[g]=0),u[g]+=D.duration/60});const y=Object.values(u).filter(D=>D>0).length,p=H(),a={es:{title:"días con estudio en el año",mon:"Lun",wed:"Mié",fri:"Vie",less:"Menos",more:"Más"},en:{title:"days with study in the year",mon:"Mon",wed:"Wed",fri:"Fri",less:"Less",more:"More"},pt:{title:"dias com estudo no ano",mon:"Seg",wed:"Qua",fri:"Sex",less:"Menos",more:"Mais"},zh:{title:"天有学习记录",mon:"一",wed:"三",fri:"五",less:"少",more:"多"}},f=a[p]||a.es,t=[];let d=new Date(m);const $=d.getUTCDay();for(d.setUTCDate(d.getUTCDate()-$);d<=b||t.length<53;){const D=[];for(let s=0;s<7;s++)D.push(new Date(d)),d.setUTCDate(d.getUTCDate()+1);if(t.push(D),D[0]>b)break}const M=[];t.forEach((D,s)=>{const r=D.find(c=>c.getUTCDate()===1&&c.getUTCFullYear()===l);if(r){const c=r.toLocaleDateString(p==="es"?"es-AR":p,{month:"short"});M.push({name:c,weekIdx:s})}});let i='<div class="flex flex-col gap-1 w-full min-w-max">';i+='<div class="flex gap-[2px] text-[10px] text-gray-400 mb-1 pl-8">',t.forEach((D,s)=>{const r=M.find(c=>c.weekIdx===s);i+=`<div style="width: 10px; overflow:visible; white-space:nowrap;">${r?r.name:""}</div>`}),i+="</div>",i+='<div class="flex items-start">',i+='<div class="flex flex-col gap-[3px] pr-2 text-[10px] text-gray-500 pt-[14px] flex-shrink-0 sticky left-0 z-10">',["",f.mon,"",f.wed,"",f.fri,""].forEach(D=>{i+=`<div style="height: 10px; line-height: 10px;">${D}</div>`}),i+="</div>",i+='<div class="flex gap-[2px]">',t.forEach(D=>{i+='<div class="flex flex-col gap-[2px]">',D.forEach(s=>{const{year:r,month:c,day:S}=o(s,x),g=r===l,C=`${r}-${String(c+1).padStart(2,"0")}-${String(S).padStart(2,"0")}`,k=g&&u[C]?u[C]:0;let A=g?B(k):"rgba(255,255,255,0.03)";k===0&&g&&(A="rgba(255,255,255,0.08)");const N=s.toLocaleDateString("es-AR",{day:"numeric",month:"long",year:"numeric"});i+=`
                        <div class="heatmap-cell rounded-[2px]" 
                             style="width: 10px; height: 10px; background-color: ${A};"
                             data-date="${C}"
                             data-hours="${k.toFixed(1)}"
                             title="${N}: ${k.toFixed(1)}h">
                        </div>
                    `}),i+="</div>"}),i+="</div></div></div>";const U=`
                <div class="flex flex-col w-full">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-white font-semibold text-sm">
                            ${y} ${f.title}
                        </h3>
                    </div>

                    <div class="w-full overflow-x-auto pb-2">
                            ${i}
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
            `;w.innerHTML=U,n(w,p)})(T)}catch(o){console.error("Error loading study heatmap:",o)}}function _(e,o,n){const h=e.getBoundingClientRect(),x=15;let w=o+x,v=n-h.height-x;w+h.width>window.innerWidth-10&&(w=o-h.width-x),w<10&&(w=10),v<10&&(v=n+x),v+h.height>window.innerHeight-10&&(v=window.innerHeight-h.height-10),e.style.left=`${w}px`,e.style.top=`${v}px`}async function F(){const e=Y(),o=H();try{console.log("Loading weekly objectives stats...");const n=await I("/weekly-objectives/stats/");console.log("Weekly objectives stats loaded:",n);const h=document.getElementById("weekly-objectives-total"),x=document.getElementById("weekly-objectives-completed"),w=document.getElementById("weekly-objectives-rate");h&&(h.textContent=n.total_objectives.toString()),x&&(x.textContent=n.completed_objectives.toString()),w&&(w.textContent=`${n.completion_rate}%`);const v=document.getElementById("weekly-objectives-history");v&&(n.weekly_stats.length===0?v.innerHTML=`
                    <div class="text-center text-gray-500 text-sm py-4">
                        ${e.progress.emptyWeeklyObjectiveStats}
                    </div>
                `:v.innerHTML=n.weekly_stats.map(E=>{const T=new Date(E.week_start),L=new Date(E.week_end),l=T.toLocaleDateString(o,{day:"numeric",month:"short"}),m=L.toLocaleDateString(o,{day:"numeric",month:"short"}),b=l.charAt(0).toUpperCase()+l.slice(1),u=m.charAt(0).toUpperCase()+m.slice(1);return`
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
                `}).join(""))}catch(n){console.error("Error loading weekly objectives stats:",n);const h=document.getElementById("weekly-objectives-history");if(h){const x="Error al cargar estadísticas";h.innerHTML=`
                <div class="text-center text-gray-500 text-sm py-4">
                    ${x}: ${n}
                </div>
            `}}}function J(e){const o=new Date,n=new Date(o.toLocaleString("en-US",{timeZone:e})),h=new Date(n);h.setHours(24,0,0,0);const x=h.getTime()-n.getTime();console.log(`Scheduling weekly stats in ${x} ms`),setTimeout(()=>{F(),setInterval(F,10080*60*1e3)},x)}(async function(){try{const n=(await z()).timezone??"UTC";J(n),await F()}catch(o){console.error("Error initializing weekly stats:",o),await F()}})();async function W(){try{await Promise.all([V(),q(),K(),Q(),F()])}catch(e){console.error("Error loading progress:",e)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",W):W();
