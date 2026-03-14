import"./modulepreload-polyfill-B5Qt9EMX.js";import{b as z,a as O,i as G,c as U}from"./auth-gate-BmIZwCWq.js";import{t as P,g as H,b as Z}from"./responsive-Bo8QNGoF.js";document.addEventListener("DOMContentLoaded",async function(){try{await z()}catch(i){console.error("Error al cargar información del usuario:",i),(i.message==="No autenticado"||i.message==="Sesión expirada")&&(window.location.href="/login")}const s=document.getElementById("logoutBtn");s&&s.addEventListener("click",async i=>{i.preventDefault();try{await O(),window.location.href="/"}catch(a){console.error("Error al cerrar sesión:",a),window.location.href="/"}})});G({loginPath:"/login"});const W=typeof window<"u"&&(window.matchMedia?.("(hover: none), (pointer: coarse)").matches||navigator.maxTouchPoints>0);function R(s){if(s<60)return`${s}m`;const i=Math.floor(s/60),a=s%60;return a===0?`${i}h`:`${i}h ${a}m`}function B(s){return s===0?"#1f2937":s<1?"#6b21a8":s<2?"#7c3aed":s<4?"#a855f7":"#c084fc"}async function V(){const s=await z();s.timezone;try{const i=await U("/pomodoro/"),a=P(),f=H(),x=new Date,y=new Date(x.toLocaleString("en-US",{timeZone:s.timezone})),b=new Date(y);b.setMonth(b.getMonth()-6),b.setDate(1),b.setHours(0,0,0,0);const S=i.filter(o=>new Date(new Date(o.start_time).toLocaleString("en-US",{timeZone:s.timezone}))>=b),T={};S.forEach(o=>{const c=new Date(new Date(o.start_time).toLocaleString("en-US",{timeZone:s.timezone})),d=`${c.getFullYear()}-${String(c.getMonth()+1).padStart(2,"0")}`;T[d]=(T[d]||0)+o.duration/60});const D=Object.keys(T).sort(),p=[],g=[];D.forEach(o=>{const[c,d]=o.split("-"),k=new Date(parseInt(c),parseInt(d)-1,1).toLocaleDateString(f,{month:"short"}),E=k.charAt(0).toUpperCase()+k.slice(1);p.push(E),g.push(T[o])});const w=document.getElementById("monthly-rhythm-chart-container"),e=document.getElementById("monthly-rhythm-chart");if(!w||!e)return;if(g.length===0||S.length===0){const o=Z[H()];w.innerHTML=`
                <div class="flex flex-col items-center justify-center h-full py-12">
                    <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-purple-500/20 flex items-center justify-center mb-4" style="box-shadow: 0 0 0 1px rgba(168,85,247,0.3);">
                        <i data-lucide="trending-up" class="w-8 h-8 text-purple-400"></i>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-2">${o.progress.monthlyRhythm}</h3>
                    <p class="text-gray-400 text-sm text-center max-w-xs">${o.progress.monthlyRhythmDesc}</p>
                </div>
            `,typeof lucide<"u"&&lucide.createIcons();return}const m=w.clientWidth-40,l=240,n={top:20,right:20,bottom:40,left:50},h=m-n.left-n.right,t=l-n.top-n.bottom,r=Math.max(...g,1),$=h/Math.max(1,g.length-1);let L="";const u=[];g.forEach((o,c)=>{const d=n.left+c*$,v=n.top+t-o/r*t;u.push({x:d,y:v})});let j="",I="";if(u.length>1){I=`M ${u[0].x} ${u[0].y}`,j=`M ${u[0].x} ${u[0].y}`;for(let d=1;d<u.length;d++){const v=u[d-1],k=u[d],E=v.x+(k.x-v.x)*.4,C=v.y,M=k.x-(k.x-v.x)*.4,F=k.y,A=` C ${E} ${C}, ${M} ${F}, ${k.x} ${k.y}`;I+=A,j+=A}const o=u[u.length-1],c=u[0];j+=` L ${o.x} ${n.top+t}`,j+=` L ${c.x} ${n.top+t}`,j+=" Z",L=j}e.setAttribute("width",m.toString()),e.setAttribute("height",l.toString()),e.setAttribute("viewBox",`0 0 ${m} ${l}`),e.innerHTML=`
            <!-- Grid lines -->
            ${Array.from({length:5},(o,c)=>{const d=n.top+t/4*c;return`<line x1="${n.left}" y1="${d}" x2="${n.left+h}" y2="${d}" stroke="#1e212b" stroke-width="1" />`}).join("")}
            
            <!-- Area fill with gradient -->
            <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#a855f7" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="#a855f7" stop-opacity="0.05"/>
                </linearGradient>
            </defs>
            <path d="${L}" fill="url(#lineGradient)" />
            
            <!-- Line (smooth curve) -->
            <path d="${I}" 
                  fill="none" 
                  stroke="#a855f7" 
                  stroke-width="3" 
                  stroke-linecap="round" 
                  stroke-linejoin="round" />
            
            <!-- Data points -->
            ${u.map((o,c)=>{const d=g[c];return`
                    <g>
                        <circle cx="${o.x}" cy="${o.y}" r="5" fill="#1e212b" stroke="#a855f7" stroke-width="2" 
                                class="cursor-pointer hover:r-7 transition-all" 
                                data-month="${p[c]}" 
                                data-hours="${d.toFixed(1)}"/>
                        <title>${p[c]}: ${d.toFixed(1)}h</title>
                    </g>
                `}).join("")}
            
            <!-- X-axis labels -->
            ${p.map((o,c)=>`<text x="${n.left+c*$}" y="${l-10}" text-anchor="middle" fill="#6b7280" font-size="10">${o}</text>`).join("")}
            
            <!-- Y-axis labels -->
            ${Array.from({length:5},(o,c)=>{const d=n.top+t/4*(4-c),v=r/4*c;return`<text x="${n.left-10}" y="${d+4}" text-anchor="end" fill="#6b7280" font-size="10">${v.toFixed(1)}h</text>`}).join("")}
        `,W||e.querySelectorAll("circle").forEach((c,d)=>{const v=g[d],k=p[d];c.addEventListener("mouseenter",E=>{const C=E,M=document.createElement("div");M.id="rhythm-tooltip",M.className="fixed bg-dark-card border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white shadow-lg z-50 pointer-events-none",M.innerHTML=`
                        <div class="font-bold text-purple-400">${k}</div>
                        <div class="text-gray-300">${v.toFixed(1)} ${a.progress.hours}</div>
                    `,document.body.appendChild(M),N(M,C.clientX,C.clientY)}),c.addEventListener("mouseleave",()=>{const E=document.getElementById("rhythm-tooltip");E&&E.remove()}),c.addEventListener("mousemove",E=>{const C=E,M=document.getElementById("rhythm-tooltip");M&&N(M,C.clientX,C.clientY)})})}catch(i){console.error("Error loading monthly rhythm:",i)}}function q(s,i){new Date(s.toLocaleString("en-US",{timeZone:"UTC"}));const f=new Date(s.toLocaleString("en-US",{timeZone:i})).getDay();return f===0?7:f}async function X(){const s=await z();try{const i=await U("/pomodoro/"),a=new Date,f=s.timezone??"UTC",x=q(a,f),y=new Date(a),b=x-1;y.setDate(a.getDate()-b),y.setHours(0,0,0,0);const S=new Set;i.forEach(m=>{const l=new Date(m.start_time),h=new Intl.DateTimeFormat("en-US",{timeZone:f,year:"numeric",month:"2-digit",day:"2-digit"}).format(l),t=new Date(h);t>=y&&t<=a&&S.add(h)});const T=Math.floor((a.getTime()-y.getTime())/(1e3*60*60*24))+1,D=Math.round(S.size/7*100),p=document.querySelector(".bg-dark-card.animate-on-load.delay-400"),g=document.getElementById("consistency-progress-circle"),w=document.getElementById("consistency-percentage"),e=document.getElementById("consistency-feedback");if(g){const m=2*Math.PI*70,l=m-D/100*m;g.setAttribute("stroke-dashoffset",l.toString())}if(w&&(w.textContent=`${D}%`),e){const m=H(),l={es:["¡Excelente constancia!","Muy buena constancia","Buen ritmo, sigue así","Puedes mejorar tu constancia","Intenta estudiar más días"],en:["Excellent consistency!","Very good consistency","Good pace, keep it up","You can improve your consistency","Try to study more days"],zh:["极佳的坚持！","非常好的坚持","节奏不错，继续保持","可以提升坚持度","尝试更多天学习"],pt:["Consistência excelente!","Muito boa consistência","Bom ritmo, continue assim","Você pode melhorar a constância","Tente estudar mais dias"]},n=l[m]||l.es;let h="";D>=85?h=n[0]:D>=70?h=n[1]:D>=50?h=n[2]:D>=30?h=n[3]:h=n[4],e.textContent=h}}catch(i){console.error("Error loading weekly consistency:",i)}}async function K(){const s=P(),i=await z();try{let a=function(t,r){const $=new Date(t.toLocaleString("en-US",{timeZone:r}));return{year:$.getFullYear(),month:$.getMonth(),day:$.getDate()}};const f=await U("/pomodoro/"),x=await U("/subjects/"),y=i.timezone??"UTC",b=new Date,{year:S,month:T}=a(b,y),D=f.filter(t=>{if(!t||!t.start_time||typeof t.duration!="number")return!1;const r=new Date(t.start_time);if(isNaN(r.getTime()))return!1;const{year:$,month:L}=a(r,y);return $===S&&L===T}),p={};let g=0;D.forEach(t=>{let r=null;t.subject!==null&&t.subject!==void 0&&(r=typeof t.subject=="string"?parseInt(t.subject):t.subject);const $=r!==null&&!isNaN(r)?r:-1;p[$]||(p[$]=0),p[$]+=t.duration,g+=t.duration});const w=x.filter(t=>p[t.id]&&p[t.id]>0).map(t=>({id:t.id,name:t.name,minutes:p[t.id],percentage:g>0?p[t.id]/g*100:0})).sort((t,r)=>r.minutes-t.minutes);p[-1]&&p[-1]>0&&w.push({id:-1,name:s.dashboard.focusDistributionNoSubject,minutes:p[-1],percentage:g>0?p[-1]/g*100:0});const e=["#a855f7","#60a5fa","#34d399","#fbbf24","#ec4899","#8b5cf6","#f97316","#06b6d4"];let m="",l=0;w.forEach((t,r)=>{const $=t.id===-1?"#4b5563":e[r%e.length],L=l,u=l+t.percentage;m+=`${$} ${L}% ${u}%, `,l=u});const n=document.getElementById("focus-distribution-donut"),h=n?.parentElement;if(n&&h){if(D.length===0||w.length===0){h.innerHTML=`
                    <div class="flex flex-col items-center justify-center h-full py-12">
                        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-purple-500/20 flex items-center justify-center mb-4" style="box-shadow: 0 0 0 1px rgba(168,85,247,0.3);">
                            <i data-lucide="pie-chart" class="w-8 h-8 text-purple-400"></i>
                        </div>
                        <h3 class="text-lg font-bold text-white mb-2">${s.progress.monthlyFocus}</h3>
                        <p class="text-gray-400 text-sm text-center max-w-xs">${s.progress.monthlyFocusDesc}</p>
                    </div>
                `,typeof lucide<"u"&&lucide.createIcons();return}n.style.background=`conic-gradient(${m.slice(0,-2)})`;const t=document.getElementById("focus-total-hours-month");t&&(t.textContent=R(g));const r=document.getElementById("focus-legend-month");r&&(r.innerHTML=w.map(($,L)=>`
                        <div class="flex items-center gap-1">
                            <span class="w-2 h-2 rounded-full" style="background-color: ${$.id===-1?"#4b5563":e[L%e.length]}"></span>
                            <span class="text-xs text-gray-400">${$.name}</span>
                        </div>
                    `).join(""))}}catch(a){console.error("Error loading monthly focus distribution:",a)}}async function Q(){const s=await z();try{let i=function(p,g){const w=new Date(p.toLocaleString("en-US",{timeZone:g}));return{year:w.getFullYear(),month:w.getMonth(),day:w.getDate()}},a=function(p,g){if(W)return;p.querySelectorAll(".heatmap-cell").forEach(e=>{e.addEventListener("mouseenter",m=>{const l=m;let n=document.getElementById("heatmap-tooltip");n||(n=document.createElement("div"),n.id="heatmap-tooltip",n.className="fixed bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-xs text-white shadow-xl z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-8px]",document.body.appendChild(n));const h=e.getAttribute("data-date"),t=e.getAttribute("data-hours");if(h){const r=new Date(h),$=new Date(r.getUTCFullYear(),r.getUTCMonth(),r.getUTCDate()),L=g==="en"?"en-US":g==="pt"?"pt-BR":g==="zh"?"zh-CN":"es-AR",u=$.toLocaleDateString(L,{day:"numeric",month:"long",year:"numeric"}),j=parseFloat(t||"0"),I=P();n.innerHTML=`<span class="font-semibold text-white">${j>0?j.toFixed(1)+" "+I.progress.hours:I.progress.noStudy}</span> <span class="text-gray-400"> ${I.progress.on} ${u}</span>`,N(n,l.clientX,l.clientY)}}),e.addEventListener("mouseleave",()=>{const m=document.getElementById("heatmap-tooltip");m&&m.remove()}),e.addEventListener("mousemove",m=>{const l=document.getElementById("heatmap-tooltip");l&&N(l,m.clientX,m.clientY)})})};const f=await U("/pomodoro/"),x=s.timezone??"UTC",y=document.getElementById("heatmap-container"),b=document.getElementById("heatmap-total");if(b&&(b.style.display="none"),!y)return;const S=new Date,{year:T}=i(S,x);(p=>{const g=new Date(Date.UTC(p,0,1,0,0,0)),w=new Date(Date.UTC(p,11,31,23,59,59)),e={};f.forEach(o=>{if(!o||!o.start_time||typeof o.duration!="number")return;const c=new Date(o.start_time),{year:d,month:v,day:k}=i(c,x);if(d!==p)return;const E=`${d}-${String(v+1).padStart(2,"0")}-${String(k).padStart(2,"0")}`;e[E]||(e[E]=0),e[E]+=o.duration/60});const m=Object.values(e).filter(o=>o>0).length,l=H(),n={es:{title:"días con estudio en el año",mon:"Lun",wed:"Mié",fri:"Vie",less:"Menos",more:"Más"},en:{title:"days with study in the year",mon:"Mon",wed:"Wed",fri:"Fri",less:"Less",more:"More"},pt:{title:"dias com estudo no ano",mon:"Seg",wed:"Qua",fri:"Sex",less:"Menos",more:"Mais"},zh:{title:"天有学习记录",mon:"一",wed:"三",fri:"五",less:"少",more:"多"}},h=n[l]||n.es,t=[];let r=new Date(g);const $=r.getUTCDay();for(r.setUTCDate(r.getUTCDate()-$);r<=w||t.length<53;){const o=[];for(let c=0;c<7;c++)o.push(new Date(r)),r.setUTCDate(r.getUTCDate()+1);if(t.push(o),o[0]>w)break}const L=[];t.forEach((o,c)=>{const d=o.find(v=>v.getUTCDate()===1&&v.getUTCFullYear()===p);if(d){const v=d.toLocaleDateString(l==="es"?"es-AR":l,{month:"short"});L.push({name:v,weekIdx:c})}});let u='<div class="flex flex-col gap-1 w-full min-w-max">';u+='<div class="flex gap-[2px] text-[10px] text-gray-400 mb-1 pl-8">',t.forEach((o,c)=>{const d=L.find(v=>v.weekIdx===c);u+=`<div style="width: 10px; overflow:visible; white-space:nowrap;">${d?d.name:""}</div>`}),u+="</div>",u+='<div class="flex items-start">',u+='<div class="flex flex-col gap-[3px] pr-2 text-[10px] text-gray-500 pt-[14px] flex-shrink-0 sticky left-0 z-10">',["",h.mon,"",h.wed,"",h.fri,""].forEach(o=>{u+=`<div style="height: 10px; line-height: 10px;">${o}</div>`}),u+="</div>",u+='<div class="flex gap-[2px]">',t.forEach(o=>{u+='<div class="flex flex-col gap-[2px]">',o.forEach(c=>{const{year:d,month:v,day:k}=i(c,x),E=d===p,C=`${d}-${String(v+1).padStart(2,"0")}-${String(k).padStart(2,"0")}`,M=E&&e[C]?e[C]:0;let F=E?B(M):"rgba(255,255,255,0.03)";M===0&&E&&(F="rgba(255,255,255,0.08)");const A=c.toLocaleDateString("es-AR",{day:"numeric",month:"long",year:"numeric"});u+=`
                        <div class="heatmap-cell rounded-[2px]" 
                             style="width: 10px; height: 10px; background-color: ${F};"
                             data-date="${C}"
                             data-hours="${M.toFixed(1)}"
                             title="${A}: ${M.toFixed(1)}h">
                        </div>
                    `}),u+="</div>"}),u+="</div></div></div>";const I=`
                <div class="flex flex-col w-full">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-white font-semibold text-sm">
                            ${m} ${h.title}
                        </h3>
                    </div>

                    <div class="w-full overflow-x-auto pb-2">
                            ${u}
                    </div>

                    <div class="flex items-center justify-between mt-3 text-xs text-gray-500">
                        <div class="flex items-center gap-1">
                            <span>${h.less}</span>
                            <div style="width:10px; height:10px; background-color: rgba(255,255,255,0.08);" class="rounded-[2px]"></div>
                            <div style="width:10px; height:10px; background-color: ${B(.5)};" class="rounded-[2px]"></div>
                            <div style="width:10px; height:10px; background-color: ${B(2)};" class="rounded-[2px]"></div>
                            <div style="width:10px; height:10px; background-color: ${B(4)};" class="rounded-[2px]"></div>
                            <div style="width:10px; height:10px; background-color: ${B(8)};" class="rounded-[2px]"></div>
                            <span>${h.more}</span>
                        </div>
                    </div>
                </div>
            `;y.innerHTML=I,a(y,l)})(T)}catch(i){console.error("Error loading study heatmap:",i)}}function N(s,i,a){const f=s.getBoundingClientRect(),x=15;let y=i+x,b=a-f.height-x;y+f.width>window.innerWidth-10&&(y=i-f.width-x),y<10&&(y=10),b<10&&(b=a+x),b+f.height>window.innerHeight-10&&(b=window.innerHeight-f.height-10),s.style.left=`${y}px`,s.style.top=`${b}px`}async function _(){const s=P(),i=H();try{console.log("Loading weekly objectives stats...");const a=await U("/weekly-objectives/stats/");console.log("Weekly objectives stats loaded:",a);const f=document.getElementById("weekly-objectives-total"),x=document.getElementById("weekly-objectives-completed"),y=document.getElementById("weekly-objectives-rate");f&&(f.textContent=a.total_objectives.toString()),x&&(x.textContent=a.completed_objectives.toString()),y&&(y.textContent=`${a.completion_rate}%`);const b=document.getElementById("weekly-objectives-history"),S=document.getElementById("weekly-objectives-pagination");if(b)if(a.weekly_stats.length===0)b.innerHTML=`
                    <div class="text-center text-gray-500 text-sm py-4">
                        ${s.progress.emptyWeeklyObjectiveStats}
                    </div>
                `,S&&(S.innerHTML="");else{const D=Math.ceil(a.weekly_stats.length/5),p=e=>{const m=new Date(e.week_start),l=new Date(e.week_end),n=m.toLocaleDateString(i,{day:"numeric",month:"short"}),h=l.toLocaleDateString(i,{day:"numeric",month:"short"}),t=n.charAt(0).toUpperCase()+n.slice(1),r=h.charAt(0).toUpperCase()+h.slice(1);return`
                    <div class="flex justify-between items-center gap-3 bg-dark-input rounded-lg p-3">
                        <div class="text-sm text-gray-300">
                            ${t} - ${r}
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                            <span class="text-xs text-gray-400">${e.completed}/${e.total}</span>
                            <div class="w-16 bg-gray-700 rounded-full h-2">
                                <div class="bg-purple-500 h-2 rounded-full transition-all duration-300"
                                     style="width: ${e.completion_rate}%"></div>
                            </div>
                            <span class="text-xs font-medium text-purple-400">${e.completion_rate.toFixed(0)}%</span>
                        </div>
                    </div>
                `},g=e=>{if(!S)return;if(D<=1){S.innerHTML="";return}const m=5;let l=Math.max(1,e-2),n=Math.min(D,l+m-1);l=Math.max(1,n-m+1);const h=[];for(let t=l;t<=n;t++)h.push(t);S.innerHTML=`
                        <button type="button" data-page="${e-1}" ${e===1?"disabled":""}
                            class="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-gray-700 bg-dark-input text-gray-300 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:border-purple-500/60 transition-colors">�</button>
                        ${h.map(t=>`
                            <button type="button" data-page="${t}"
                                class="w-9 h-9 sm:w-10 sm:h-10 rounded-full border text-sm font-semibold transition-all ${t===e?"border-purple-400 bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.35)]":"border-gray-700 bg-dark-input text-gray-300 hover:border-purple-500/60"}">${t}</button>
                        `).join("")}
                        <button type="button" data-page="${e+1}" ${e===D?"disabled":""}
                            class="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-gray-700 bg-dark-input text-gray-300 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:border-purple-500/60 transition-colors">�</button>
                    `,S.querySelectorAll("button[data-page]").forEach(t=>{t.addEventListener("click",()=>{const r=Number(t.dataset.page||"1");Number.isNaN(r)||r<1||r>D||r===e||w(r)})})},w=e=>{const m=Math.min(Math.max(e,1),D),l=(m-1)*5,n=a.weekly_stats.slice(l,l+5);b.innerHTML=n.map(p).join(""),g(m)};w(1)}}catch(a){console.error("Error loading weekly objectives stats:",a);const f=document.getElementById("weekly-objectives-history"),x=document.getElementById("weekly-objectives-pagination");if(f){const y="Error al cargar estadisticas";f.innerHTML=`
                <div class="text-center text-gray-500 text-sm py-4">
                    ${y}: ${a}
                </div>
            `}x&&(x.innerHTML="")}}function J(s){const i=new Date,a=new Date(i.toLocaleString("en-US",{timeZone:s})),f=new Date(a);f.setHours(24,0,0,0);const x=f.getTime()-a.getTime();console.log(`Scheduling weekly stats in ${x} ms`),setTimeout(()=>{_(),setInterval(_,10080*60*1e3)},x)}(async function(){try{const a=(await z()).timezone??"UTC";J(a),await _()}catch(i){console.error("Error initializing weekly stats:",i),await _()}})();async function Y(){try{await Promise.all([V(),X(),K(),Q(),_()])}catch(s){console.error("Error loading progress:",s)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Y):Y();
