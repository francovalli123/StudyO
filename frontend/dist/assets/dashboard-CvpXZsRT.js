import"./modulepreload-polyfill-B5Qt9EMX.js";import{a as Ge,i as Ke,g as F,b as D,c as Ze,d as De,e as Je,f as Ye,h as Le,j as Ve,B as Xe}from"./auth-gate-BVWKmKT_.js";import{i as Qe,s as et,a as pe}from"./confirmModal-r5-RcnPR.js";import{g as q,s as tt,a as ae,t as S}from"./responsive-BEQ_P_Nu.js";import{h as ot,s as nt,g as ue,a as z,b as U,c as Se,d as at,p as rt}from"./onboarding-DyRprQDl.js";document.addEventListener("DOMContentLoaded",function(){const e=t=>{if(!t)return;const a=document.getElementById("firstName");if(a){const i=t.first_name?t.first_name:t.username;a.textContent=i}const s=document.getElementById("dashAvatarImg"),c=t.avatar||t.avatar_url||t.photo||t.profile_image;s instanceof HTMLImageElement&&c&&(s.src=c)},o=window.__studyoAuthState;o&&o.status==="authenticated"&&o.user&&e(o.user),window.addEventListener("auth:state",t=>{const a=t&&t.detail?t.detail:null;a&&(a.status==="authenticated"&&e(a.user),a.status==="unauthenticated"&&(window.location.href="/login"))});const r=document.getElementById("profileAvatarBtn");r&&r.addEventListener("click",()=>{window.location.href="/profile"});const n=document.getElementById("logoutBtn");n&&n.addEventListener("click",async t=>{t.preventDefault();try{await Ge(),window.location.href="/"}catch(a){console.error("Error al cerrar sesión:",a),window.location.href="/"}})});Ke({loginPath:"/login"});function Te(){function e(){document.body.classList.add("concentration-mode");const t=document.getElementById("pomodoroSettingsModal");t&&(t.style.display="none");try{const a=document.documentElement;a.requestFullscreen&&a.requestFullscreen().catch(()=>{})}catch{}}function o(){document.body.classList.remove("concentration-mode");try{document.fullscreenElement&&document.exitFullscreen()}catch{}try{window.hideEnterToast?.()}catch{}const t=document.getElementById("pomodoroSettingsModal");t&&(t.style.display="none"),setTimeout(()=>{try{window.showExitToast?.()}catch{}},120)}const r=document.getElementById("concentrationToggleBtn"),n=document.getElementById("concentrationExitBtn");r&&r.addEventListener("click",t=>{if(t.preventDefault(),document.body.classList.contains("concentration-mode"))o();else{e();try{window.showEnterToast?.()}catch{}}}),n&&n.addEventListener("click",t=>{t.preventDefault(),o()}),document.addEventListener("keydown",t=>{t.key==="Escape"&&document.body.classList.contains("concentration-mode")&&o()}),document.addEventListener("fullscreenchange",()=>{!document.fullscreenElement&&document.body.classList.contains("concentration-mode")&&o()})}function it(){const e=S(),o=document.getElementById("concentrationEnterToast");if(o){const n=o.querySelector(".title");n&&(n.textContent=e.dashboard.concentrationEnterTitle);const t=n?.nextElementSibling;t&&(t.textContent=e.dashboard.concentrationEnterBody);const a=o.querySelector(".close-x");a&&a.setAttribute("title",e.common.close)}const r=document.getElementById("concentrationExitToast");if(r){const n=r.querySelector(".title");n&&(n.textContent=e.dashboard.concentrationExitTitle);const t=n?.nextElementSibling;t&&(t.textContent=e.dashboard.concentrationExitBody);const a=r.querySelector(".close-x");a&&a.setAttribute("title",e.common.close)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Te):Te();function st(e){if(!e)return"No programado";const o=new Date(e),r=new Date,n=o.getTime()-r.getTime(),t=Math.ceil(n/(1e3*60*60*24));return t<0?"Pasado":t===0?"Hoy":t===1?"Mañana":t<=7?`En ${t} días`:o.toLocaleDateString("es-AR",{day:"numeric",month:"short"})}function Ie(e){return e&&{1:"Alta",2:"Media",3:"Baja"}[e]||"Sin prioridad"}function Be(e){return e&&{1:"#ef4444",2:"#f59e0b",3:"#10b981"}[e]||"#71717a"}async function ct(){try{const e=await D("/habits/"),o=e.length,r=e.length>0?Math.max(...e.map(i=>i.streak)):0,n=e.length>0?Math.round(e.reduce((i,d)=>i+d.streak,0)/e.length):0,t=document.getElementById("total-habits"),a=document.getElementById("max-streak"),s=document.getElementById("avg-streak");t&&(t.textContent=o.toString()),a&&(a.textContent=r.toString()),s&&(s.textContent=n.toString());const c=document.getElementById("recent-habits");if(c){const i=[...e].sort((d,m)=>m.streak-d.streak).slice(0,5);i.length===0?c.innerHTML='<p class="empty-state">No tenés hábitos aún. <a href="/habits">Creá tu primer hábito</a></p>':c.innerHTML=i.map(d=>`
                    <div class="habit-item">
                        <div class="habit-info">
                            <h4>${d.name}</h4>
                            <span class="habit-frequency">${d.frequency===1?"Diario":"Semanal"}</span>
                        </div>
                        <div class="habit-streak">
                            <span class="streak-badge">🔥 ${d.streak}</span>
                        </div>
                    </div>
                `).join("")}}catch(e){console.error("Error loading habits:",e);const o=document.getElementById("recent-habits");o&&(o.innerHTML='<p class="error-state">Error al cargar hábitos</p>')}}async function lt(){try{const e=await D("/subjects/"),o=e.length,r=e.length>0?Math.round(e.reduce((c,i)=>c+i.progress,0)/e.length):0,n=document.getElementById("total-subjects"),t=document.getElementById("avg-progress");if(n&&(n.textContent=o.toString()),t){t.textContent=`${r}%`;const c=document.getElementById("avg-progress-bar");c&&(c.style.width=`${r}%`)}const a=document.getElementById("upcoming-exams");if(a){const c=e.filter(i=>i.next_exam_date).sort((i,d)=>!i.next_exam_date||!d.next_exam_date?0:new Date(i.next_exam_date).getTime()-new Date(d.next_exam_date).getTime()).slice(0,5);c.length===0?a.innerHTML='<p class="empty-state">No tenés exámenes programados</p>':a.innerHTML=c.map(i=>{const d=st(i.next_exam_date),m=Be(i.priority);return`
                        <div class="subject-item">
                            <div class="subject-info">
                                <h4>${i.name}</h4>
                                <span class="exam-date">${d}</span>
                            </div>
                            <div class="subject-meta">
                                <span class="priority-badge" style="background-color: ${m}20; color: ${m}">
                                    ${Ie(i.priority)}
                                </span>
                                <div class="progress-mini">
                                    <div class="progress-mini-bar" style="width: ${i.progress}%"></div>
                                </div>
                            </div>
                        </div>
                    `}).join("")}const s=document.getElementById("all-subjects");s&&(e.length===0?s.innerHTML='<p class="empty-state">No tenés materias aún. <a href="/subjects">Agregá tu primera materia</a></p>':s.innerHTML=e.map(c=>{const i=Be(c.priority);return`
                        <div class="subject-card">
                            <div class="subject-header">
                                <h4>${c.name}</h4>
                                <span class="priority-badge" style="background-color: ${i}20; color: ${i}">
                                    ${Ie(c.priority)}
                                </span>
                            </div>
                            <div class="progress-section">
                                <div class="progress-info">
                                    <span>Progreso</span>
                                    <span>${c.progress}%</span>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${c.progress}%"></div>
                                </div>
                            </div>
                        </div>
                    `}).join(""))}catch(e){console.error("Error loading subjects:",e)}}let Y="all";async function G(){try{const e=await D("/weekly-objectives/"),o=document.getElementById("weeklyObjectivesContainer");if(!o)return;localStorage.setItem("weeklyObjectives",JSON.stringify(e));let r=e;Y==="completed"?r=e.filter(t=>t.is_completed):Y==="incomplete"&&(r=e.filter(t=>!t.is_completed));const n=S();if(r.length===0){let t=n.dashboard.emptyObjectivesTitle,a=n.dashboard.emptyObjectivesDesc,s=!0;Y==="completed"?(t=n.dashboard.emptyCompletedTitle,a=n.dashboard.emptyCompletedDesc,s=!1):Y==="incomplete"&&(t=n.dashboard.emptyIncompleteTitle,a=n.dashboard.emptyIncompleteDesc,s=!1),o.innerHTML=`
                <div class="flex flex-col items-center justify-center py-12 text-center animate-fade animated">
                    ${s?`
                    <div class="relative mb-5 group cursor-pointer" onclick="document.getElementById('addObjectiveBtn').click()">
                        <div class="absolute inset-0 bg-purple-500/20 rounded-full blur-xl group-hover:bg-purple-500/30 transition-all duration-500"></div>
                        <div class="relative w-20 h-20 bg-[#1a1d26] rounded-full flex items-center justify-center border border-gray-800 group-hover:border-purple-500/50 group-hover:scale-105 transition-all duration-300 shadow-xl">
                            <i data-lucide="crosshair" class="w-10 h-10 text-gray-500 group-hover:text-purple-400 transition-colors duration-300"></i>
                        </div>
                    </div>`:""}

                    <h3 class="text-xl font-bold text-white mb-2 tracking-tight">
                        ${t}
                    </h3>

                    <p class="text-gray-500 text-sm max-w-[280px] mx-auto leading-relaxed ${s?"mb-6":""}">
                        ${a}
                    </p>

                    ${s?`
                    <div class="animate-bounce text-gray-700">
                        <i data-lucide="arrow-down" class="w-5 h-5"></i>
                    </div>`:""}
                </div>
            `}else o.innerHTML=r.map(t=>{const a={1:{name:n.dashboard.highPriority,color:"#ef4444",bg:"rgba(239, 68, 68, 0.1)",border:"rgba(239, 68, 68, 0.2)"},2:{name:n.dashboard.keyExploration,color:"#f59e0b",bg:"rgba(245, 158, 11, 0.1)",border:"rgba(245, 158, 11, 0.2)"},3:{name:n.dashboard.complementary,color:"#10b981",bg:"rgba(16, 185, 129, 0.1)",border:"rgba(16, 185, 129, 0.2)"}},s=a[t.priority||2]||a[2],c=t.icon||"⚡",i=t.area||"General";return`
                    <div class="objective-item bg-dark-input rounded-2xl p-5 relative group transition-all duration-300 hover:bg-[#1f222e] hover:translate-y-[-2px]" 
                        data-objective-id="${t.id}" 
                        style="box-shadow: 0 0 0 1px rgba(255,255,255,0.05);">
                        
                        <div class="objective-header flex justify-between items-start mb-3 relative">
                            <div class="objective-meta flex items-center gap-2.5 flex-1 min-w-0">
                                <span class="text-lg filter drop-shadow-md icon-display cursor-pointer hover:text-2xl transition-all" data-id="${t.id}" title="Haz clic para editar" data-field="icon">
                                    ${c}
                                </span>
                                <span class="objective-area text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-400 tracking-wide area-display cursor-pointer hover:opacity-80 transition-all" data-id="${t.id}" title="Haz clic para editar" data-field="area">
                                    ${i}
                                </span>
                            </div>
                            
                            <div class="objective-actions flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button class="complete-objective p-1.5 rounded-lg text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-all duration-200" data-id="${t.id}" title="Completar">
                                    <i data-lucide="check" class="w-4 h-4"></i>
                                </button>
                                <button class="edit-objective p-1.5 rounded-lg text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all duration-200" data-id="${t.id}" title="Editar">
                                    <i data-lucide="edit-3" class="w-4 h-4"></i>
                                </button>
                                <button class="delete-objective p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200" data-id="${t.id}" title="Eliminar">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>

                        <div class="text-white text-base font-semibold mb-2 leading-snug ${t.is_completed?"line-through text-gray-500":""}">
                            ${t.title}
                        </div>
                        
                        <p class="text-gray-500 text-xs mb-4 leading-relaxed line-clamp-2">
                            ${t.detail}
                        </p>
                        
                        <div class="flex items-center justify-between mt-auto pt-3 border-t border-gray-800/50">
                            <span class="text-[10px] font-bold px-2 py-1 rounded tracking-wider" 
                                style="color: ${s.color}; background: ${s.bg}; border: 1px solid ${s.border}">
                                ${s.name}
                            </span>
                            
                            ${t.notes?`
                            <div class="objective-notes flex items-center gap-1.5 text-xs text-purple-400/80">
                                <i data-lucide="folder-open" class="w-3 h-3"></i>
                                <span class="italic truncate max-w-[120px]">${t.notes}</span>
                            </div>`:""}
                        </div>
                    </div>
                `}).join(""),o.querySelectorAll(".edit-objective").forEach(t=>{t.addEventListener("click",async a=>{a.stopPropagation(),a.preventDefault();const s=t.getAttribute("data-id");if(s){const c=Number(s),i=e.find(d=>d.id===c);if(i){const d=document.getElementById("objectiveTitle"),m=document.getElementById("objectiveDetail"),f=document.getElementById("objectiveArea"),y=document.getElementById("objectiveIcon"),p=document.getElementById("objectivePriority"),b=document.getElementById("objectiveNotes");d&&(d.value=i.title),m&&(m.value=i.detail||""),f&&(f.value=i.area||"General"),p&&(p.value=(i.priority||2).toString()),b&&(b.value=i.notes||"");const h=document.getElementById("submitObjectiveBtn");h&&(h.textContent=n.dashboard.updateObjective),window.editingObjectiveId=c,ae();const x=document.getElementById("objectiveModal");x&&(x.style.display="flex")}}})}),o.querySelectorAll(".delete-objective").forEach(t=>{t.addEventListener("click",async a=>{a.stopPropagation(),a.preventDefault();const s=t.getAttribute("data-id");s&&await ut(Number(s))})}),o.querySelectorAll(".complete-objective").forEach(t=>{t.addEventListener("click",async a=>{a.stopPropagation(),a.preventDefault();const s=t.getAttribute("data-id");s&&await mt(Number(s))})}),o.querySelectorAll(".icon-display, .area-display").forEach(t=>{t.addEventListener("click",async a=>{const s=t.getAttribute("data-id");if(s){const c=Number(s),i=e.find(d=>d.id===c);if(i){const d=document.getElementById("objectiveTitle"),m=document.getElementById("objectiveDetail"),f=document.getElementById("objectiveArea"),y=document.getElementById("objectiveIcon"),p=document.getElementById("objectivePriority"),b=document.getElementById("objectiveNotes");d&&(d.value=i.title),m&&(m.value=i.detail||""),f&&(f.value=i.area||"General"),y&&(y.value=i.icon||"⚡"),p&&(p.value=(i.priority||2).toString()),b&&(b.value=i.notes||"");const h=document.getElementById("submitObjectiveBtn");h&&(h.textContent=n.dashboard.updateObjective),window.editingObjectiveId=c,ae();const x=document.getElementById("objectiveModal");x&&(x.style.display="flex")}}})});typeof lucide<"u"&&lucide.createIcons()}catch(e){console.error("Error loading weekly objectives:",e)}}function dt(){const e=document.querySelectorAll("#weeklyObjectivesFilters .filter-btn");e.forEach(o=>{o.addEventListener("click",()=>{e.forEach(n=>n.classList.remove("bg-purple-500","text-white")),e.forEach(n=>n.classList.add("bg-gray-700","text-white")),o.classList.add("bg-purple-500","text-white"),Y=o.getAttribute("data-filter"),G()})}),e.forEach(o=>{o.getAttribute("data-filter")==="all"&&(o.classList.add("bg-purple-500","text-white"),o.classList.remove("bg-gray-700"))})}async function ut(e){const o=S();if(await et(o.confirmations.deleteEventMessage,o.common.delete))try{await Ye(`/weekly-objectives/${e}/`),G()}catch(n){console.error("Error deleting objective:",n),await pe("Error al eliminar el objetivo. Por favor, intenta nuevamente.","Error")}}async function mt(e){if(Le())try{const n=(await D("/weekly-objectives/")).find(a=>a.id===e);if(!n)return;const t=!n.is_completed;await Ve(`/weekly-objectives/${e}/`,{is_completed:t}),await G();try{document.dispatchEvent(new CustomEvent("weeklyChallenge:update"))}catch{}}catch(r){console.error("Error toggling objective completion:",r),await pe("Error al actualizar el objetivo. Por favor, intenta nuevamente.","Error")}}async function je(){const e=document.getElementById("objectiveModal");if(e){try{const o=await D("/subjects/"),r=document.getElementById("objectiveSubject");if(r){const n=S();r.innerHTML=`<option value="">-- ${n.habits.none} --</option>`+o.map(t=>`<option value="${t.id}">${t.name}</option>`).join("")}}catch(o){console.warn("Could not load subjects for objective modal",o)}ae(),e.style.display="flex"}}function R(){const e=document.getElementById("objectiveModal");e&&(e.style.display="none");const o=document.getElementById("objectiveForm");o&&o.reset(),window.editingObjectiveId=null;const r=document.getElementById("submitObjectiveBtn");if(r){const n=S();r.textContent=n.dashboard.createObjective}}async function $e(e){e.preventDefault();const o=document.getElementById("objectiveTitle"),r=document.getElementById("objectiveDetail"),n=document.getElementById("objectiveArea"),t=document.getElementById("objectiveIcon"),a=document.getElementById("objectivePriority"),s=document.getElementById("objectiveNotes");if(!o||!o.value){alert("Por favor ingresá un título");return}try{const c={title:o.value,detail:r?.value||"",notes:s?.value||"",priority:a?.value?Number(a.value):2,area:n?.value||"General",icon:t?.value||"⚡",subject:null};console.log("Sending objective data:",c);const i=window.editingObjectiveId;i?(console.log(`Updating objective ${i}...`),await Ze(`/weekly-objectives/${i}/`,c),window.editingObjectiveId=null):(console.log("Creating new objective..."),await De("/weekly-objectives/",c,!0)),R(),await G();try{document.dispatchEvent(new CustomEvent("weeklyChallenge:update"))}catch{}}catch(c){console.error("Error creating/updating objective:",c),alert("Error al guardar el objetivo")}}async function re(){try{console.log("[loadWeeklyChallenge] Starting...");const e=await D("/weekly-challenge/active/");if(console.log("[loadWeeklyChallenge] Response:",e),!e){console.warn("Unexpected: Backend returned null for active challenge"),gt();return}pt(e),console.log("[loadWeeklyChallenge] Rendered UI")}catch(e){console.error("Error loading weekly challenge:",e),ft()}}let ne=null;document.addEventListener("weeklyChallenge:update",()=>{try{console.log("[loadWeeklyChallenge:listener] Event received, debouncing..."),ne&&window.clearTimeout(ne),ne=window.setTimeout(()=>{console.log("[loadWeeklyChallenge:listener] Debounce complete, loading challenge..."),re().catch(e=>console.error("Error reloading weekly challenge:",e)),ne=null},300)}catch{}});function pt(e){const o=document.querySelector("[data-challenge-container]");if(!o)return;const r=S(),n=e.status==="completed",t=n?"check-circle":"zap",a=n?"bg-green-500/20 text-green-400 border-green-500/30":"bg-purple-500/20 text-purple-400 border-purple-500/30",s=n?"from-green-500 via-emerald-500 to-green-500":"from-purple-500 via-pink-500 to-purple-500",c=n?"rgba(34,197,94,0.5)":"rgba(168,85,247,0.5)",i=`
    <span class="px-3 py-1 rounded-full text-xs font-semibold border ${a} flex items-center gap-1" style="width: fit-content;">
      <i data-lucide="${t}" class="w-3 h-3"></i>
      <span>
        ${n?r.dashboard.weeklyChallengeStatusCompleted:r.dashboard.weeklyChallengeStatusActive}
      </span>
    </span>
  `,d=r.dashboard.weeklyChallengeProgress.replace("{current}",e.current_value.toString()).replace("{target}",e.target_value.toString());o.innerHTML=`
    <div class="space-y-4">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <h3 class="text-white font-medium mb-1">${e.title}</h3>
          <p class="text-gray-500 text-sm mb-4">${e.description}</p>
        </div>
        <div class="flex-shrink-0">
          ${i}
        </div>
      </div>
      
      <div class="space-y-2">
        <div class="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
          <div class="bg-gradient-to-r ${s} h-2 rounded-full transition-all duration-500 ease-out" 
               style="width: ${Math.min(e.progress_percentage,100)}%; box-shadow: 0 0 10px ${c};">
          </div>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-xs bg-gradient-to-r ${n?"from-green-400 to-emerald-400":"from-purple-400 to-pink-400"} bg-clip-text text-transparent font-medium">
            ${d}
          </span>
          <span class="text-xs text-gray-500">${e.progress_percentage.toFixed(0)}%</span>
        </div>
      </div>

    </div>
  `,typeof lucide<"u"&&lucide.createIcons&&lucide.createIcons();try{const m=document.querySelector("[data-challenge-container]");m&&(m.style.transition=m.style.transition||"opacity 250ms ease",m.style.opacity="1",m.style.visibility="visible",m.classList.remove("animate-fade","animated"))}catch{}}function gt(){const e=document.querySelector("[data-challenge-container]");if(!e)return;const o=S();e.innerHTML=`
    <div class="text-center py-6">
      <i data-lucide="award" class="w-8 h-8 text-gray-500 mx-auto mb-2"></i>
      <p class="text-gray-400 text-sm">${o.dashboard.weeklyChallengeEmpty}</p>
    </div>
  `,typeof lucide<"u"&&lucide.createIcons&&lucide.createIcons()}function ft(){const e=document.querySelector("[data-challenge-container]");if(!e)return;const o=S();e.innerHTML=`
    <div class="text-center py-4">
      <p class="text-red-400 text-sm">${o.dashboard.weeklyChallengeError}</p>
    </div>
  `}async function V(){try{const e=await D("/pomodoro/"),o=(await F()).timezone||Intl.DateTimeFormat().resolvedOptions().timeZone,r=(y,p)=>new Intl.DateTimeFormat("en-CA",{timeZone:p,year:"numeric",month:"2-digit",day:"2-digit"}).format(y),n=r(new Date,o),t=e.filter(y=>{const p=new Date(y.start_time);return r(p,o)===n}),a=t.reduce((y,p)=>y+p.duration,0),s=t.length,c=X(o),i=e.filter(y=>new Date(y.start_time)>=c).length,d=document.getElementById("sessions-today"),m=document.getElementById("minutes-today");d&&(d.textContent=s.toString()),m&&(m.textContent=a.toString());try{document.dispatchEvent(new CustomEvent("pomodoro:sessionsUpdated",{detail:{totalSessionsThisWeek:i,totalSessionsToday:s}}))}catch{}const f=document.getElementById("recent-sessions");if(f){const y=e.sort((p,b)=>new Date(b.start_time).getTime()-new Date(p.start_time).getTime()).slice(0,5);y.length===0?f.innerHTML='<p class="empty-state">No tenés sesiones de Pomodoro aún</p>':f.innerHTML=y.map(p=>{const h=new Date(p.start_time).toLocaleDateString("es-AR",{day:"numeric",month:"short"});return`
                        <div class="pomodoro-item">
                            <div class="pomodoro-info">
                                <h4>${p.duration} min</h4>
                                <span class="pomodoro-date">${h}</span>
                            </div>
                            ${p.notes?`<p class="pomodoro-notes">${p.notes}</p>`:""}
                        </div>
                    `}).join("")}}catch(e){console.error("Error loading pomodoro sessions:",e)}}function X(e){const o=new Date(new Intl.DateTimeFormat("en-US",{timeZone:e,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!1}).format(new Date)),r=o.getDay(),n=r===0?6:r-1,t=new Date(o);return t.setDate(o.getDate()-n),t.setHours(0,0,0,0),t}async function yt(){const o=(await F()).timezone??"UTC";X(o);try{const r=S(),n=await D("/pomodoro/"),t=X(o),a=n.map(p=>({...p,date:new Date(p.start_time)})).filter(p=>p.date>=t),s={0:0,1:0,2:0,3:0,4:0,5:0,6:0};a.forEach(p=>{const b=p.date.getDay();s[b]+=p.duration});const c=r.dashboard.weekDaysAbbrebiation,i=[s[1],s[2],s[3],s[4],s[5],s[6],s[0]],d=Math.max(...i,1),m=120,f=document.getElementById("weekly-rhythm-chart"),y=f?.parentElement;if(f&&y){const p=y.querySelector(".absolute.bottom-0.flex");if(p&&(p.innerHTML=c.map(g=>`<span>${g}</span>`).join("")),a.length===0){const g=f;g.innerHTML=`
                    <foreignObject width="100%" height="100%">
                         <div class="flex flex-col items-center justify-center h-full pb-6">
                            <i data-lucide="bar-chart-2" class="w-8 h-8 text-gray-600 mb-2"></i>
                            <p class="text-gray-500 text-xs text-center">${r.dashboard.emptyRhythmTitle}</p>
                        </div>
                    </foreignObject>
                `,typeof lucide<"u"&&lucide.createIcons();return}const b=f,x=450/6;let w="";const E=[];if(i.forEach((g,k)=>{const I=k*x,T=m-g/d*m;E.push({x:I,y:T})}),E.length>1){let g=`M ${E[0].x} ${E[0].y}`;for(let k=1;k<E.length;k++){const I=E[k-1],T=E[k],W=I.x+(T.x-I.x)/2,O=I.y,$=T.x-(T.x-I.x)/2,K=T.y;g+=` C ${W} ${O}, ${$} ${K}, ${T.x} ${T.y}`}w=g}else E.length===1&&(w=`M ${E[0].x} ${E[0].y}`);const L=r.dashboard.weekDays;b.innerHTML=`
                <path d="${w}" fill="none" stroke="#c084fc" stroke-width="3" />
                ${E.map((g,k)=>{const I=i[k],T=(I/60).toFixed(1);return`
                        <g>
                            <circle cx="${g.x}" cy="${g.y}" r="4" fill="#1e212b" stroke="#c084fc" stroke-width="2" 
                                    class="cursor-pointer hover:r-6 transition-all" 
                                    data-day="${L[k]}" 
                                    data-hours="${T}"
                                    data-minutes="${I}"/>
                            <title>${L[k]}: ${T}h (${I} min)</title>
                        </g>
                    `}).join("")}
            `,b.querySelectorAll("circle").forEach((g,k)=>{const I=i[k],T=(I/60).toFixed(1),W=L[k];g.addEventListener("mouseenter",O=>{const $=document.createElement("div");$.id="rhythm-tooltip",$.className="fixed bg-dark-card border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white shadow-lg z-50 pointer-events-none",$.innerHTML=`
                        <div class="font-bold text-purple-400">${W}</div>
                        <div class="text-gray-300">${T}h (${I} min)</div>
                    `,document.body.appendChild($),Me($,O.clientX,O.clientY)}),g.addEventListener("mouseleave",()=>{const O=document.getElementById("rhythm-tooltip");O&&O.remove()}),g.addEventListener("mousemove",O=>{const $=document.getElementById("rhythm-tooltip");$&&Me($,O.clientX,O.clientY)})})}}catch(r){console.error("Error loading weekly study rhythm:",r)}}async function Oe(){const e=S();try{const r=(await F()).timezone??"UTC",n=await D("/pomodoro/"),t=await D("/subjects/"),a=X(r),s=n.filter(h=>new Date(h.start_time)>=a),c={};let i=0;s.forEach(h=>{let x=null;h.subject!==null&&h.subject!==void 0&&(x=typeof h.subject=="string"?parseInt(h.subject):h.subject);const w=x!==null&&!isNaN(x)?x:-1;c[w]||(c[w]=0),c[w]+=h.duration,i+=h.duration});const d=Object.entries(c).filter(([h,x])=>x>0).map(([h,x])=>{const w=parseInt(h);let E=e.dashboard.focusDistributionNoSubject;if(w!==-1){const L=t.find(A=>A.id===w);E=L?L.name:`Materia ${w}`}return{id:w,name:E,minutes:x,percentage:i>0?x/i*100:0}}).sort((h,x)=>x.minutes-h.minutes),m=["#a855f7","#60a5fa","#34d399","#fbbf24","#ec4899","#8b5cf6"];let f=0;const y=d.map((h,x)=>{const w=m[x%m.length],E=f;return f+=h.percentage,`${w} ${E}% ${f}%`}).join(", "),p=document.getElementById("focus-distribution-chart"),b=p?.parentElement;if(p&&b){if(s.length===0||d.length===0){b.innerHTML=`
                    <div class="flex flex-col items-center justify-center h-full py-8">
                        <i data-lucide="pie-chart" class="w-12 h-12 text-gray-600 mb-3"></i>
                        <p class="text-gray-500 text-sm text-center">${e.dashboard.emptyDistributionTitle}</p>
                        <p class="text-gray-600 text-xs text-center mt-1">${e.dashboard.emptyDistributionDesc}</p>
                    </div>
                `,typeof lucide<"u"&&lucide.createIcons();return}p.style.background=`conic-gradient(${y})`;const h=document.getElementById("focus-total-hours");if(h)if(i<60)h.textContent=`${i}m`;else{const w=Math.floor(i/60),E=i%60;h.textContent=E===0?`${w}h`:`${w}h ${E}m`}const x=document.getElementById("focus-legend");x&&(x.innerHTML=d.slice(0,4).map((w,E)=>`
                        <div class="flex items-center gap-1">
                            <span class="w-2 h-2 rounded-full" style="background-color: ${m[E%m.length]}"></span>
                            <span class="text-[10px] text-gray-400">${w.name}</span>
                        </div>
                    `).join(""))}}catch(o){console.error("Error loading focus distribution:",o)}}async function ht(){try{const e=S(),o=28,r=3,n=60,a=(await F()).timezone??"UTC",s=await D("/pomodoro/"),c=new Date;let i=X(a);i.setDate(i.getDate()-21);const d=s.map(g=>({...g,date:new Date(g.start_time)})).filter(g=>!g||!g.start_time||typeof g.duration!="number"||isNaN(g.date.getTime())||g.date>c||g.duration<=0?!1:g.date>=i),m=()=>{const g=document.getElementById("peak-productivity-time");g&&(g.textContent=e.dashboard.emptyPeakProductivityTitle);const k=document.getElementById("peak-productivity-desc");k&&(k.textContent=e.dashboard.emptyPeakProductivityDesc)};if(d.length<r){m();return}if(d.reduce((g,k)=>g+k.duration,0)<n){m();return}const y={};d.forEach(g=>{const k=g.date.getDay(),I=g.date.getHours();y[k]??={},y[k][I]=(y[k][I]||0)+g.duration});let p=-1,b=-1,h=0;if(Object.entries(y).forEach(([g,k])=>{Object.entries(k).forEach(([I,T])=>{T>h&&(h=T,p=Number(g),b=Number(I))})}),p===-1||b===-1){m();return}const x=Math.max(0,b-1),w=Math.min(23,b+1),E=g=>`${g.toString().padStart(2,"0")}:00`,L=document.getElementById("peak-productivity-time");if(L){const g=e.dashboard.days[p];L.textContent=`${g}, ${E(x)} - ${E(w)}`}const A=document.getElementById("peak-productivity-desc");A&&(A.textContent=e.dashboard.peakProductivityAnalysisDesc)}catch(e){console.error("Error loading peak productivity:",e)}}function Me(e,o,r){const n=e.getBoundingClientRect(),t=15;let a=o+t,s=r-n.height-t;a+n.width>window.innerWidth-10&&(a=o-n.width-t),a<10&&(a=10),s<10&&(s=r+t),s+n.height>window.innerHeight-10&&(s=window.innerHeight-n.height-10),e.style.left=`${a}px`,e.style.top=`${s}px`}async function bt(e,o){const r=Le();if(r)try{const n=document.querySelector(`[data-habit-id="${e}"]`)?.closest(".flex.items-center.justify-between");if(n){const s=n.querySelector(".w-6.h-6.rounded"),c=n.querySelector(".flex.items-center.gap-2"),i=n.querySelector(".text-xs")?.parentElement;s&&c&&(o?(s.className="w-6 h-6 rounded bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-purple-500/20 flex items-center justify-center",s.style.boxShadow="0 0 0 1px rgba(168,85,247,0.3)",s.innerHTML='<i data-lucide="check" class="w-4 h-4 text-purple-400"></i>',c.className="flex items-center gap-2 text-gray-400 line-through"):(s.className="w-6 h-6 rounded border border-gray-600 flex items-center justify-center group-hover:border-purple-500",s.style.boxShadow="",s.innerHTML="",c.className="flex items-center gap-2 text-gray-300 font-medium"),typeof lucide<"u"&&lucide.createIcons())}const t=await fetch(`${Xe}/habits/${e}/complete/`,{method:o?"POST":"DELETE",headers:{"Content-Type":"application/json",Authorization:`Token ${r}`}});if(!t.ok)throw new Error("API Error");const a=await t.json();if(a.streak!==void 0&&n){const s=n.querySelector(".text-xs")?.textContent;if(s&&s.match(/\d+/)){const i=n.querySelector(".text-xs");i&&(i.innerHTML=`<i data-lucide="trending-up" class="w-3 h-3"></i> ${a.streak}`,typeof lucide<"u"&&lucide.createIcons())}}me()}catch(n){console.error("Error toggling habit:",n),alert("Error de conexión. No se guardó."),me()}}async function me(){try{const e=S(),r=(await D("/habits/")).filter(d=>d.is_key),n=document.getElementById("key-habits-container");if(!n)return;if(r.length===0){n.innerHTML=`
                <div class="text-center py-8 text-gray-500">
                    <i data-lucide="target" class="w-8 h-8 mx-auto mb-2 text-gray-600"></i>
                    <p class="text-sm">${e.dashboard.emptyKeyHabitsTitle}</p>
                    <p class="text-xs mt-1">${e.dashboard.emptyKeyHabitsDesc}</p>
                </div>
            `,typeof lucide<"u"&&lucide.createIcons();return}const t=[...r].sort((d,m)=>m.streak-d.streak),a=t.filter(d=>d.completed_today).length,s=t.length>0?Math.round(a/t.length*100):0;n.innerHTML=t.map(d=>{const m=d.completed_today;return`
                <div class="flex items-center justify-between bg-dark-input p-4 rounded-xl relative group transition-all duration-300" 
                    style="box-shadow: 0 0 0 1px rgba(168,85,247,0.15), 0 0 15px rgba(168,85,247,0.08);"
                    data-habit-id="${d.id}">
                    <div class="flex items-center gap-4 flex-1">
                        <button class="habit-complete-btn w-6 h-6 rounded ${m?"bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-purple-500/20 flex items-center justify-center cursor-pointer":"border border-gray-600 flex items-center justify-center group-hover:border-purple-500 cursor-pointer transition-all"}" 
                            style="${m?"box-shadow: 0 0 0 1px rgba(168,85,247,0.3);":""}"
                            data-habit-id="${d.id}"
                            data-completed="${m}"
                            title="${m?"Marcar como no completado":"Marcar como completado"}">
                            ${m?'<i data-lucide="check" class="w-4 h-4 text-purple-400"></i>':""}
                        </button>
                        <div class="flex items-center gap-2 ${m?"text-gray-400 line-through":"text-gray-300 font-medium"}">
                            <i data-lucide="target" class="w-4 h-4 text-purple-400"></i>
                            ${d.name}
                        </div>
                    </div>
                    <div class="flex items-center gap-1 text-xs bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        <i data-lucide="trending-up" class="w-3 h-3"></i>
                        <p class="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-semibold">
                            ${e.dashboard.keyHabitsStreak||"Streak:"} ${d.streak}
                        </p>
                    </div>
                </div>
            `}).join(""),n.querySelectorAll(".habit-complete-btn").forEach(d=>{d.addEventListener("click",async m=>{m.stopPropagation();const f=m.currentTarget,y=Number(f.getAttribute("data-habit-id")),p=f.getAttribute("data-completed")==="true";await bt(y,!p)})});const c=document.getElementById("daily-progress-bar"),i=document.getElementById("daily-progress-text");c&&(c.style.width=`${s}%`),i&&(i.textContent=`${s}%`),typeof lucide<"u"&&lucide.createIcons()}catch(e){console.error("Error loading key habits:",e)}}async function vt(){const e=S(),o=document.getElementById("nextEventContainer");if(o)try{const r=await Je(),n=new Date,t=r.filter(b=>new Date(`${b.date}T${b.start_time}`)>n).sort((b,h)=>{const x=new Date(`${b.date}T${b.start_time}`),w=new Date(`${h.date}T${h.start_time}`);return x.getTime()-w.getTime()});if(t.length===0){o.innerHTML=`
                <div class="flex flex-col items-center justify-center py-8">
                    <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-purple-500/20 flex items-center justify-center mb-4" style="box-shadow: 0 0 0 1px rgba(168,85,247,0.3);">
                        <i data-lucide="calendar-x" class="w-8 h-8 text-purple-400"></i>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-2">${e.dashboard.emptyNextEventTitle}</h3>
                    <p class="text-gray-400 text-sm mb-4 text-center">${e.dashboard.emptyNextEventDesc}</p>
                    <a href="/planner" class="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 text-purple-400 text-sm hover:from-purple-500/30 hover:via-pink-500/30 hover:to-purple-500/30 transition-all border border-purple-500/30 inline-flex items-center gap-2">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        <span>${e.dashboard.emptyNextEventAction}</span>
                    </a>
                </div>
            `,typeof lucide<"u"&&lucide.createIcons();return}const a=t[0],s=a.start_time.substring(0,5),c=a.end_time.substring(0,5),i=typeof q=="function"?q():"es",d=new Date(`${a.date}T00:00:00`),m=new Date;m.setHours(0,0,0,0);let f;if(d.getTime()===m.getTime())f={es:"Hoy",en:"Today",pt:"Hoje",zh:"今天"}[i]||"Hoy";else{const b=d.toLocaleDateString(i,{weekday:"short",day:"numeric",month:"short"});f=b.charAt(0).toUpperCase()+b.slice(1)}const y={1:e.dashboard.eventTypeStudyBlock,2:e.dashboard.eventTypeExam,3:e.dashboard.eventTypeImportantTask,4:e.dashboard.eventTypePersonal},p=a.type===2?"exam":a.type===3?"task":a.type===4?"personal":"";o.innerHTML=`
            <div class="space-y-4">
                <div class="event-item ${p} p-4">
                    <div class="mb-2">
                        <span class="inline-flex text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400 mb-2">${y[a.type]||"Evento"}</span>
                        <h3 class="text-lg font-bold text-white leading-tight">${a.title}</h3>
                    </div>
                    <div class="flex items-center gap-4 text-sm text-gray-400">
                        <div class="flex items-center gap-1">
                            <i data-lucide="calendar" class="w-4 h-4"></i>
                            <span class="font-medium text-purple-300">${f}</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <i data-lucide="clock" class="w-4 h-4"></i>
                            <span>${s} - ${c}</span>
                        </div>
                    </div>
                    ${a.notes?`<p class="text-sm text-gray-500 mt-2">${a.notes}</p>`:""}
                </div>
                <a href="/planner" class="block text-center text-sm text-purple-400 hover:text-purple-300 transition-colors">
                    ${e.dashboard.plannerFull}
                </a>
            </div>
        `,typeof lucide<"u"&&lucide.createIcons()}catch(r){console.error("Error loading next event:",r);const n=S();o.innerHTML=`
            <div class="flex flex-col items-center justify-center py-8">
                <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-purple-500/20 flex items-center justify-center mb-4" style="box-shadow: 0 0 0 1px rgba(168,85,247,0.3);">
                    <i data-lucide="calendar-x" class="w-8 h-8 text-purple-400"></i>
                </div>
                <h3 class="text-lg font-bold text-white mb-2">${n.dashboard.emptyNextEventTitle}</h3>
                <p class="text-gray-400 text-sm mb-4 text-center">${n.dashboard.emptyNextEventDesc}</p>
                <a href="/planner" class="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 text-purple-400 text-sm hover:from-purple-500/30 hover:via-pink-500/30 hover:to-purple-500/30 transition-all border border-purple-500/30 inline-flex items-center gap-2">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    <span>${n.dashboard.emptyNextEventAction}</span>
                </a>
            </div>
        `,typeof lucide<"u"&&lucide.createIcons()}}async function Ce(){const e=document.getElementById("dashboard-content");e&&(e.innerHTML='<p class="loading">Cargando datos del dashboard...</p>');try{try{const r=await F(),n=r.language||r.preferences?.language;n&&n!==q()&&(tt(n),ae())}catch{}it();const o=document.getElementById("pomodoroTagline");if(o){const r=q(),n={es:"Define tu ritmo. Domina tu tiempo.",en:"Set your rhythm. Master your time.",zh:"设定你的节奏，掌控你的时间。",pt:"Defina seu ritmo. Domine seu tempo."};o.textContent=n[r]||n.es}await Promise.all([ct(),lt(),V(),G(),re(),yt(),Oe(),ht(),me(),vt()]),e&&(e.style.display="none")}catch(o){console.error("Error loading dashboard:",o),e&&(e.innerHTML='<p class="error-state">Error al cargar el dashboard. Por favor, recargá la página.</p>')}}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{Qe(),Ce();const e=document.getElementById("addObjectiveBtn");e&&e.addEventListener("click",je);const o=document.getElementById("closeObjectiveModalBtn");o&&o.addEventListener("click",R);const r=document.getElementById("cancelObjectiveBtn");r&&r.addEventListener("click",R);const n=document.getElementById("objectiveForm");n&&n.addEventListener("submit",$e);const t=document.getElementById("objectiveModal");t&&t.addEventListener("click",a=>{a.target===t&&R()})});else{Ce(),re(),dt(),G();const e=document.getElementById("addObjectiveBtn");e&&e.addEventListener("click",je);const o=document.getElementById("closeObjectiveModalBtn");o&&o.addEventListener("click",R);const r=document.getElementById("cancelObjectiveBtn");r&&r.addEventListener("click",R);const n=document.getElementById("objectiveForm");n&&n.addEventListener("submit",$e);const t=document.getElementById("objectiveModal");t&&t.addEventListener("click",a=>{a.target===t&&R()})}(()=>{let o={...{workMinutes:25,shortBreakMinutes:5,longBreakMinutes:15,cyclesBeforeLongBreak:4}},r=null,n=o.workMinutes*60,t="work",a=!1,s=0,c={totalSessionsThisWeek:0,sessionsToday:0},i=Intl.DateTimeFormat().resolvedOptions().timeZone,d=null,m=null,f=null,y=null,p=null,b=null,h=0,x=null;window.__studyoCaptureFocusState=()=>{try{return{type:"pomodoro",isRunning:a,remainingSeconds:n,currentStage:t,timerStartTime:b,timerStartRemaining:h,settings:{...o},defaultSubjectId:y,completedCycles:s,sessionStart:f?f.toISOString():null,capturedAt:new Date().toISOString()}}catch{return null}};let w=null,E=!1;const L=document.getElementById("pomodoroProgressCircle"),A=document.getElementById("pomodoroTimerDisplay"),g=document.getElementById("pomodoroStageLabel"),k=document.getElementById("pomodorosCount"),I=document.getElementById("pomodoroSetLabel"),T=document.getElementById("pomodoroPlayBtn"),W=document.getElementById("pomodoroSkipBtn"),O=document.getElementById("pomodoroResetBtn"),$=document.getElementById("pomodoroSettingsBtn"),K=document.getElementById("pomodoroTooltip"),Pe=document.getElementById("closePomodoroTooltip");let _=null;const N=document.getElementById("pomodoroSettingsModal"),ge=document.getElementById("pomodoroSettingsForm"),Q=document.getElementById("workMinutes"),ee=document.getElementById("shortBreakMinutes"),te=document.getElementById("longBreakMinutes"),oe=document.getElementById("cyclesBeforeLongBreak"),Z=document.getElementById("pomodoroDefaultSubjectSelect"),fe=document.getElementById("pomodoroSettingsCancel"),_e=552;function Ne(){if(ue()?.active||!K||localStorage.getItem("studyo_onboarding_done"))return;setTimeout(()=>{localStorage.getItem("studyo_onboarding_done")||K.classList.remove("hidden")},2e3);const u=()=>{K.classList.add("hidden"),localStorage.setItem("studyo_onboarding_done","true")};Pe?.addEventListener("click",v=>{v.stopPropagation(),u()}),$?.addEventListener("click",u)}function ie(){const l=ue();if(!l||!l.active){_=null,z();return}if(_=l.step,_==="CREATE_SUBJECT"){U({title:S().onboarding?.stepCreateSubjectTitle||"Paso 1: Creá tu primera asignatura",body:S().onboarding?.stepCreateSubjectBody||"Creá 1 asignatura para activar el tracking real de tu estudio.",primaryText:S().onboarding?.createSubject||"Crear asignatura",primaryHref:"/subjects",lockClose:!0,allowSkip:!0,onSkip:async()=>{try{await Se()}catch{}z()}});return}if(_==="CREATE_HABIT"){U({title:S().onboarding?.stepCreateHabitTitle||"Paso 2: Creá un hábito",body:S().onboarding?.stepCreateHabitBody||"Ahora creá un hábito y revisá “Hábito clave”.",primaryText:S().onboarding?.goToHabits||"Ir a hábitos",primaryHref:"/habits",lockClose:!0,allowSkip:!0,onSkip:async()=>{try{await Se()}catch{}z()}});return}if(_==="CONFIG_POMODORO"){U({title:S().onboarding?.stepConfigPomodoroTitle||"Paso 3: Configurá Pomodoro",body:S().onboarding?.stepConfigPomodoroBody||"Definí una materia por defecto para registrar bien tus sesiones.",primaryText:S().dashboard.pomodoroSettings,lockClose:!0,onPrimary:()=>{z(),$?.dispatchEvent(new Event("click"))}});return}if(_==="START_SESSION"){y?U({title:"Paso 4: Iniciá tu primera sesión",body:"¡Todo listo! Iniciá tu primer pomodoro para cerrar el onboarding.",primaryText:"Empezar ahora",lockClose:!0,onPrimary:()=>T?.dispatchEvent(new Event("click"))}):U({title:"Seleccioná una asignatura",body:"Antes de iniciar tu primera sesión, elegí una materia en los ajustes de Pomodoro.",primaryText:"Ir a ajustes",lockClose:!0,onPrimary:()=>{z(),$?.dispatchEvent(new Event("click"))}});return}z()}function He(){try{const l=localStorage.getItem("pomodoroSettings");if(l){const u=JSON.parse(l);o={...o,...u},typeof u.defaultSubjectId=="number"&&(y=u.defaultSubjectId)}}catch{}}function Ae(){w||(w=new Audio("public/sounds/pomodoroSound.mp3"),w.volume=.8,w.play().then(()=>{w.pause(),w.currentTime=0}).catch(()=>{}))}function ze(){localStorage.setItem("pomodoroSettings",JSON.stringify({...o,defaultSubjectId:y}))}function Fe(l){const u=Math.floor(l/60).toString().padStart(2,"0"),v=Math.floor(l%60).toString().padStart(2,"0");return`${u}:${v}`}function J(l,u){return new Intl.DateTimeFormat("en-CA",{timeZone:u,year:"numeric",month:"2-digit",day:"2-digit"}).format(l)}function P(){if(A&&(A.textContent=Fe(n)),g){const l=q(),u={es:"Enfoque",en:"Focus",zh:"专注",pt:"Foco"},v={es:"Descanso corto",en:"Short break",zh:"短休息",pt:"Pausa curta"},M={es:"Descanso largo",en:"Long break",zh:"长休息",pt:"Pausa longa"};t==="work"?g.textContent=u[l]||u.es:t==="short_break"?g.textContent=v[l]||v.es:g.textContent=M[l]||M.es}if(L){const l=(t==="work"?o.workMinutes:t==="short_break"?o.shortBreakMinutes:o.longBreakMinutes)*60,u=Math.max(0,Math.min(1,1-n/l)),v=Math.round(_e*(1-u));L.style.strokeDashoffset=`${v}`}try{const l=q(),u={es:"Pomodoros",en:"Pomodoros",zh:"番茄钟",pt:"Pomodoros"},v={es:"Set: {current} / {total}",en:"Set: {current} / {total}",zh:"组: {current} / {total}",pt:"Conjunto: {current} / {total}"};try{const B=c.sessionsToday||0;if(k&&(k.textContent=`${u[l]||u.es}: ${B}`),I){const H=Math.max(1,o.cyclesBeforeLongBreak);let j=B%H;j===0&&B>0&&(j=H);const C=v[l]||v.es;I.textContent=C.replace("{current}",String(j)).replace("{total}",String(H))}}catch{}}catch{}}document.addEventListener("pomodoro:completed",()=>{try{V().catch(l=>console.warn("refresh stats failed",l)),re().catch(l=>console.warn("refresh weekly challenge failed",l))}catch{}}),document.addEventListener("pomodoro:sessionsUpdated",async l=>{try{const u=l,v=Number(u.detail?.totalSessionsThisWeek)||0,M=Number(u.detail?.totalSessionsToday)||0;let B=i;try{B=(await F()).timezone||B,i=B}catch{}const H=J(new Date,B),j="pomodoroReset";let C={};try{C=JSON.parse(localStorage.getItem(j)||"{}")}catch{C={}}C.day!==H&&(C={},localStorage.removeItem(j));const de=Number(C.offset||0),Ee=Math.max(0,M-de);c.rawTotalSessionsThisWeek=v,c.rawSessionsToday=M,c.totalSessionsThisWeek=v,c.sessionsToday=Ee,s=Ee,P()}catch{}});function ye(){if(w)try{w.currentTime=0,w.play().catch(()=>{})}catch(l){console.warn("Audio not available",l)}}function se(){if(!a||b===null)return;const l=Date.now(),u=Math.floor((l-b)/1e3),v=Math.max(0,h-u);v!==n&&(n=v,P()),n<=0&&ce()}async function ce(){if(ye(),document.visibilityState!=="visible"&&Ue(),r&&(clearInterval(r),r=null),t==="work"&&f){const l=new Date;let u=Math.round((l.getTime()-f.getTime())/6e4);u=Math.max(1,u);try{console.log("[finishTimer] Pomodoro finished - creating session",{start:f.toISOString(),end:l.toISOString(),duration:u,subject:y});const v=await xe(f,l,u,y);console.log("[finishTimer] Pomodoro POST completed",v)}catch(v){console.error("[finishTimer] Error saving pomodoro session",v)}f=null}ve(),n=(t==="work"?o.workMinutes:t==="short_break"?o.shortBreakMinutes:o.longBreakMinutes)*60,b=Date.now(),h=n,t==="work"&&!f&&(console.log("[finishTimer] Entering work stage - initializing sessionStart"),f=new Date),r=window.setInterval(()=>{se(),n>0&&(n-=1),n<=0&&ce(),P()},1e3),P()}async function Re(){if(!a){if((_==="CONFIG_POMODORO"||_==="START_SESSION")&&!y){U({title:"Seleccioná una asignatura",body:"Durante el onboarding no se puede iniciar pomodoro sin materia asignada.",primaryText:"Configurar ahora",lockClose:!0,onPrimary:()=>{z(),$?.dispatchEvent(new Event("click"))}});return}a=!0,le(),Ae(),We(),!f&&t==="work"&&(f=new Date,_==="START_SESSION"&&at().then(()=>{_="DONE",z();try{pe("¡Onboarding completado! Ya estás listo para usar StudyO.")}catch{}}).catch(l=>{console.warn("onboarding completion failed",l)})),b=Date.now(),h=n,p=l=>{l.preventDefault();const u=q(),v={es:"El Pomodoro se detendrá si abandonas esta página. ¿Estás seguro?",en:"The Pomodoro will stop if you leave this page. Are you sure?",zh:"离开此页面将停止番茄钟，确定继续吗？",pt:"O Pomodoro será interrompido se você sair desta página. Tem certeza?"};return l.returnValue=v[u]||v.es,l.returnValue},window.addEventListener("beforeunload",p),x||(x=()=>{!document.hidden&&a&&se()},document.addEventListener("visibilitychange",x)),r=window.setInterval(()=>{se(),n>0&&(n-=1),n<=0&&ce(),P()},1e3)}}function he(){r&&(clearInterval(r),r=null),a=!1,b=null,le(),p&&(window.removeEventListener("beforeunload",p),p=null)}function be(l=null){he(),l&&(t=l),n=(t==="work"?o.workMinutes:t==="short_break"?o.shortBreakMinutes:o.longBreakMinutes)*60,f=null,b=null,h=0,P()}function qe(){if(r&&(clearInterval(r),r=null),t==="work"&&f){const l=new Date,u=Math.max(1,Math.round((l.getTime()-f.getTime())/6e4));xe(f,l,u,y).catch(v=>console.error(v)),f=null}ye(),a=!1,le(),ve()}function ve(){t==="work"?s>0&&s%o.cyclesBeforeLongBreak===0?t="long_break":t="short_break":t="work",n=(t==="work"?o.workMinutes:t==="short_break"?o.shortBreakMinutes:o.longBreakMinutes)*60,P()}function We(){E||(E=!0,"Notification"in window&&Notification.permission==="default"&&Notification.requestPermission())}function Ue(){"Notification"in window&&Notification.permission==="granted"&&new Notification("StudyO",{body:"Pomodoro finalizado.¡Hora de un descanso!",silent:!1})}async function xe(l,u,v,M){try{const B={start_time:l.toISOString(),end_time:u.toISOString(),duration:v};M!==null&&!isNaN(M)&&(B.subject=Number(M)),console.log("[saveWorkSession] Saving pomodoro:",B);const H=await De("/pomodoro/",B,!0);console.log("[saveWorkSession] Pomodoro saved successfully",H),console.log("[saveWorkSession] Pomodoro POST sent");try{document.dispatchEvent(new CustomEvent("pomodoro:completed"))}catch{}try{document.dispatchEvent(new CustomEvent("weeklyChallenge:update"))}catch{}await V().catch(j=>console.warn("refresh stats failed",j)),await Oe().catch(j=>console.warn("refresh distribution failed",j));try{P()}catch{}return H}catch(B){throw console.error("Failed to save pomodoro session",B),B}}async function we(){if(Z)try{const l=S(),u=await D("/subjects/");Z.innerHTML=`<option value="" data-i18n="dashboard.noPomodoroSubject">${l.dashboard.noPomodoroSubject}</option>`+u.map(v=>`<option value="${v.id}">${v.name}</option>`).join(""),y&&(Z.value=y.toString())}catch(l){console.warn("Could not load subjects",l)}}function le(){T&&(T.innerHTML=a?'<i data-lucide="pause" class="w-5 h-5"></i>':'<i data-lucide="play" class="w-5 h-5 ml-1"></i>',typeof lucide<"u"&&lucide.createIcons())}document.addEventListener("DOMContentLoaded",async()=>{await ot(),nt(()=>ie()),He(),Ne();try{i=(await F()).timezone||i}catch{}d=J(new Date,i),m||(m=window.setInterval(async()=>{try{const u=J(new Date,i);d!==u&&(d=u,localStorage.removeItem("pomodoroReset"),await V(),P())}catch{}},30*1e3)),n=o.workMinutes*60,P(),T&&T.addEventListener("click",async()=>{a?he():await Re()}),W&&W.addEventListener("click",()=>qe()),O&&O.addEventListener("click",async()=>{try{s=0,be("work"),P();try{const u=await D("/pomodoro/");let v=i;try{v=(await F()).timezone||v,i=v}catch{}const M=J(new Date,v),B=u.filter(C=>{const de=new Date(C.start_time);return J(de,v)===M}).length,H="pomodoroReset",j={day:M,offset:B};localStorage.setItem(H,JSON.stringify(j)),console.log("[reset] Stored reset offset",j),s=0,P(),await V();try{document.dispatchEvent(new CustomEvent("weeklyChallenge:update"))}catch{}}catch(u){console.warn("Could not persist reset offset",u)}}catch(u){console.error("Reset failed",u)}}),$&&N&&$.addEventListener("click",async u=>{u.preventDefault(),!document.body.classList.contains("concentration-mode")&&(Q&&(Q.value=String(o.workMinutes)),ee&&(ee.value=String(o.shortBreakMinutes)),te&&(te.value=String(o.longBreakMinutes)),oe&&(oe.value=String(o.cyclesBeforeLongBreak)),await we(),N.style.display="flex",typeof lucide<"u"&&setTimeout(()=>lucide.createIcons(),10))}),fe&&N&&fe.addEventListener("click",()=>{N.style.display="none"});const l=document.getElementById("pomodoroSettingsCloseBtn");l&&N&&l.addEventListener("click",()=>{N.style.display="none"}),N&&N.addEventListener("click",u=>{u.target===N&&(N.style.display="none")}),ge&&N&&ge.addEventListener("submit",u=>{u.preventDefault();const v=Number(Q&&Q.value||o.workMinutes),M=Number(ee&&ee.value||o.shortBreakMinutes),B=Number(te&&te.value||o.longBreakMinutes),H=Number(oe&&oe.value||o.cyclesBeforeLongBreak);o.workMinutes=Math.max(1,v),o.shortBreakMinutes=Math.max(1,M),o.longBreakMinutes=Math.max(1,B),o.cyclesBeforeLongBreak=Math.max(1,H);const j=Z?Z.value:"";y=j?Number(j):null,_==="CONFIG_POMODORO"&&y&&rt("START_SESSION").then(()=>{const C=ue();C&&(C.step="START_SESSION"),_="START_SESSION",ie()}).catch(()=>{}),ze(),a||be("work"),N.style.display="none",P()}),we(),ie()})})();
