import"./modulepreload-polyfill-B5Qt9EMX.js";import{a as Ze,i as Je,g as G,b as H,c as Ye,d as Oe,e as Ve,f as Qe,h as Pe,j as Xe,B as et}from"./auth-gate-C5KWgIgn.js";import{i as tt,s as ot,a as fe}from"./confirmModal-L4nKbxRN.js";import{g as Z,t as k,s as nt,a as ce}from"./responsive-DwadFwRg.js";import{h as at,s as rt,g as pe,a as U,b as J,c as Be,d as it,p as st}from"./onboarding-DorFNt2R.js";document.addEventListener("DOMContentLoaded",function(){const e=o=>{if(!o)return;const n=document.getElementById("firstName");if(n){const s=o.first_name?o.first_name:o.username;n.textContent=s}const i=document.getElementById("dashAvatarImg"),c=o.avatar||o.avatar_url||o.photo||o.profile_image;i instanceof HTMLImageElement&&c&&(i.src=c)},t=window.__studyoAuthState;t&&t.status==="authenticated"&&t.user&&e(t.user),window.addEventListener("auth:state",o=>{const n=o&&o.detail?o.detail:null;n&&(n.status==="authenticated"&&e(n.user),n.status==="unauthenticated"&&(window.location.href="/login"))});const r=document.getElementById("profileAvatarBtn");r&&r.addEventListener("click",()=>{window.location.href="/profile"});const a=document.getElementById("logoutBtn");a&&a.addEventListener("click",async o=>{o.preventDefault();try{await Ze(),window.location.href="/"}catch(n){console.error("Error al cerrar sesión:",n),window.location.href="/"}})});Je({loginPath:"/login"});let ge=!1;const ct=typeof window<"u"&&(window.matchMedia?.("(hover: none), (pointer: coarse)").matches||navigator.maxTouchPoints>0);function _(){typeof lucide>"u"||ge||(ge=!0,window.requestAnimationFrame(()=>{ge=!1,lucide.createIcons()}))}function lt(e){const t=window;if(typeof t.requestIdleCallback=="function"){t.requestIdleCallback(e,{timeout:1200});return}window.setTimeout(e,0)}function je(){function e(){document.body.classList.add("concentration-mode");const o=document.getElementById("pomodoroSettingsModal");o&&(o.style.display="none");try{const n=document.documentElement;n.requestFullscreen&&n.requestFullscreen().catch(()=>{})}catch{}}function t(){document.body.classList.remove("concentration-mode");try{document.fullscreenElement&&document.exitFullscreen()}catch{}try{window.hideEnterToast?.()}catch{}const o=document.getElementById("pomodoroSettingsModal");o&&(o.style.display="none"),setTimeout(()=>{try{window.showExitToast?.()}catch{}},120)}const r=document.getElementById("concentrationToggleBtn"),a=document.getElementById("concentrationExitBtn");r&&r.addEventListener("click",o=>{if(o.preventDefault(),document.body.classList.contains("concentration-mode"))t();else{e();try{window.showEnterToast?.()}catch{}}}),a&&a.addEventListener("click",o=>{o.preventDefault(),t()}),document.addEventListener("keydown",o=>{o.key==="Escape"&&document.body.classList.contains("concentration-mode")&&t()}),document.addEventListener("fullscreenchange",()=>{!document.fullscreenElement&&document.body.classList.contains("concentration-mode")&&t()})}function dt(){const e=k(),t=document.getElementById("concentrationEnterToast");if(t){const a=t.querySelector(".title");a&&(a.textContent=e.dashboard.concentrationEnterTitle);const o=a?.nextElementSibling;o&&(o.textContent=e.dashboard.concentrationEnterBody);const n=t.querySelector(".close-x");n&&n.setAttribute("title",e.common.close)}const r=document.getElementById("concentrationExitToast");if(r){const a=r.querySelector(".title");a&&(a.textContent=e.dashboard.concentrationExitTitle);const o=a?.nextElementSibling;o&&(o.textContent=e.dashboard.concentrationExitBody);const n=r.querySelector(".close-x");n&&n.setAttribute("title",e.common.close)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",je):je();function ut(e){if(!e)return"No programado";const t=new Date(e),r=new Date,a=t.getTime()-r.getTime(),o=Math.ceil(a/(1e3*60*60*24));return o<0?"Pasado":o===0?"Hoy":o===1?"Mañana":o<=7?`En ${o} días`:t.toLocaleDateString("es-AR",{day:"numeric",month:"short"})}function $e(e){return e&&{1:"Alta",2:"Media",3:"Baja"}[e]||"Sin prioridad"}function Me(e){return e&&{1:"#ef4444",2:"#f59e0b",3:"#10b981"}[e]||"#71717a"}async function mt(){try{const e=await H("/habits/"),t=e.length,r=e.length>0?Math.max(...e.map(s=>s.streak)):0,a=e.length>0?Math.round(e.reduce((s,l)=>s+l.streak,0)/e.length):0,o=document.getElementById("total-habits"),n=document.getElementById("max-streak"),i=document.getElementById("avg-streak");o&&(o.textContent=t.toString()),n&&(n.textContent=r.toString()),i&&(i.textContent=a.toString());const c=document.getElementById("recent-habits");if(c){const s=[...e].sort((l,m)=>m.streak-l.streak).slice(0,5);s.length===0?c.innerHTML='<p class="empty-state">No tenés hábitos aún. <a href="/habits">Creá tu primer hábito</a></p>':c.innerHTML=s.map(l=>`
                    <div class="habit-item">
                        <div class="habit-info">
                            <h4>${l.name}</h4>
                            <span class="habit-frequency">${l.frequency===1?"Diario":"Semanal"}</span>
                        </div>
                        <div class="habit-streak">
                            <span class="streak-badge">🔥 ${l.streak}</span>
                        </div>
                    </div>
                `).join("")}}catch(e){console.error("Error loading habits:",e);const t=document.getElementById("recent-habits");t&&(t.innerHTML='<p class="error-state">Error al cargar hábitos</p>')}}async function pt(){try{const e=await H("/subjects/"),t=e.length,r=e.length>0?Math.round(e.reduce((c,s)=>c+s.progress,0)/e.length):0,a=document.getElementById("total-subjects"),o=document.getElementById("avg-progress");if(a&&(a.textContent=t.toString()),o){o.textContent=`${r}%`;const c=document.getElementById("avg-progress-bar");c&&(c.style.width=`${r}%`)}const n=document.getElementById("upcoming-exams");if(n){const c=e.filter(s=>s.next_exam_date).sort((s,l)=>!s.next_exam_date||!l.next_exam_date?0:new Date(s.next_exam_date).getTime()-new Date(l.next_exam_date).getTime()).slice(0,5);c.length===0?n.innerHTML='<p class="empty-state">No tenés exámenes programados</p>':n.innerHTML=c.map(s=>{const l=ut(s.next_exam_date),m=Me(s.priority);return`
                        <div class="subject-item">
                            <div class="subject-info">
                                <h4>${s.name}</h4>
                                <span class="exam-date">${l}</span>
                            </div>
                            <div class="subject-meta">
                                <span class="priority-badge" style="background-color: ${m}20; color: ${m}">
                                    ${$e(s.priority)}
                                </span>
                                <div class="progress-mini">
                                    <div class="progress-mini-bar" style="width: ${s.progress}%"></div>
                                </div>
                            </div>
                        </div>
                    `}).join("")}const i=document.getElementById("all-subjects");i&&(e.length===0?i.innerHTML='<p class="empty-state">No tenés materias aún. <a href="/subjects">Agregá tu primera materia</a></p>':i.innerHTML=e.map(c=>{const s=Me(c.priority);return`
                        <div class="subject-card">
                            <div class="subject-header">
                                <h4>${c.name}</h4>
                                <span class="priority-badge" style="background-color: ${s}20; color: ${s}">
                                    ${$e(c.priority)}
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
                    `}).join(""))}catch(e){console.error("Error loading subjects:",e)}}let Q="all";async function te(){try{const e=await H("/weekly-objectives/"),t=document.getElementById("weeklyObjectivesContainer");if(!t)return;localStorage.setItem("weeklyObjectives",JSON.stringify(e));let r=e;Q==="completed"?r=e.filter(o=>o.is_completed):Q==="incomplete"&&(r=e.filter(o=>!o.is_completed));const a=k();if(r.length===0){let o=a.dashboard.emptyObjectivesTitle,n=a.dashboard.emptyObjectivesDesc,i=!0;Q==="completed"?(o=a.dashboard.emptyCompletedTitle,n=a.dashboard.emptyCompletedDesc,i=!1):Q==="incomplete"&&(o=a.dashboard.emptyIncompleteTitle,n=a.dashboard.emptyIncompleteDesc,i=!1),t.innerHTML=`
                <div class="flex flex-col items-center justify-center py-12 text-center animate-fade animated">
                    ${i?`
                    <div class="relative mb-5 group cursor-pointer" onclick="document.getElementById('addObjectiveBtn').click()">
                        <div class="absolute inset-0 bg-purple-500/20 rounded-full blur-xl group-hover:bg-purple-500/30 transition-all duration-500"></div>
                        <div class="relative w-20 h-20 bg-[#1a1d26] rounded-full flex items-center justify-center border border-gray-800 group-hover:border-purple-500/50 group-hover:scale-105 transition-all duration-300 shadow-xl">
                            <i data-lucide="crosshair" class="w-10 h-10 text-gray-500 group-hover:text-purple-400 transition-colors duration-300"></i>
                        </div>
                    </div>`:""}

                    <h3 class="text-xl font-bold text-white mb-2 tracking-tight">
                        ${o}
                    </h3>

                    <p class="text-gray-500 text-sm max-w-[280px] mx-auto leading-relaxed ${i?"mb-6":""}">
                        ${n}
                    </p>

                    ${i?`
                    <div class="animate-bounce text-gray-700">
                        <i data-lucide="arrow-down" class="w-5 h-5"></i>
                    </div>`:""}
                </div>
            `}else t.innerHTML=r.map(o=>{const n={1:{name:a.dashboard.highPriority,color:"#ef4444",bg:"rgba(239, 68, 68, 0.1)",border:"rgba(239, 68, 68, 0.2)"},2:{name:a.dashboard.keyExploration,color:"#f59e0b",bg:"rgba(245, 158, 11, 0.1)",border:"rgba(245, 158, 11, 0.2)"},3:{name:a.dashboard.complementary,color:"#10b981",bg:"rgba(16, 185, 129, 0.1)",border:"rgba(16, 185, 129, 0.2)"}},i=n[o.priority||2]||n[2],c=o.icon||"⚡",s=o.area||"General";return`
                    <div class="objective-item bg-dark-input rounded-2xl p-5 relative group transition-all duration-300 hover:bg-[#1f222e] hover:translate-y-[-2px]" 
                        data-objective-id="${o.id}" 
                        style="box-shadow: 0 0 0 1px rgba(255,255,255,0.05);">
                        
                        <div class="objective-header flex justify-between items-start mb-3 relative">
                            <div class="objective-meta flex items-center gap-2.5 flex-1 min-w-0">
                                <span class="text-lg filter drop-shadow-md icon-display cursor-pointer hover:text-2xl transition-all" data-id="${o.id}" title="Haz clic para editar" data-field="icon">
                                    ${c}
                                </span>
                                <span class="objective-area text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-400 tracking-wide area-display cursor-pointer hover:opacity-80 transition-all" data-id="${o.id}" title="Haz clic para editar" data-field="area">
                                    ${s}
                                </span>
                            </div>
                            
                            <div class="objective-actions flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button class="complete-objective p-1.5 rounded-lg text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-all duration-200" data-id="${o.id}" title="Completar">
                                    <i data-lucide="check" class="w-4 h-4"></i>
                                </button>
                                <button class="edit-objective p-1.5 rounded-lg text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all duration-200" data-id="${o.id}" title="Editar">
                                    <i data-lucide="edit-3" class="w-4 h-4"></i>
                                </button>
                                <button class="delete-objective p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200" data-id="${o.id}" title="Eliminar">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>

                        <div class="text-white text-base font-semibold mb-2 leading-snug ${o.is_completed?"line-through text-gray-500":""}">
                            ${o.title}
                        </div>
                        
                        <p class="text-gray-500 text-xs mb-4 leading-relaxed line-clamp-2">
                            ${o.detail}
                        </p>
                        
                        <div class="flex items-center justify-between mt-auto pt-3 border-t border-gray-800/50">
                            <span class="text-[10px] font-bold px-2 py-1 rounded tracking-wider" 
                                style="color: ${i.color}; background: ${i.bg}; border: 1px solid ${i.border}">
                                ${i.name}
                            </span>
                            
                            ${o.notes?`
                            <div class="objective-notes flex items-center gap-1.5 text-xs text-purple-400/80">
                                <i data-lucide="folder-open" class="w-3 h-3"></i>
                                <span class="italic truncate max-w-[120px]">${o.notes}</span>
                            </div>`:""}
                        </div>
                    </div>
                `}).join(""),t.querySelectorAll(".edit-objective").forEach(o=>{o.addEventListener("click",async n=>{n.stopPropagation(),n.preventDefault();const i=o.getAttribute("data-id");if(i){const c=Number(i),s=e.find(l=>l.id===c);if(s){const l=document.getElementById("objectiveTitle"),m=document.getElementById("objectiveDetail"),x=document.getElementById("objectiveArea"),p=document.getElementById("objectiveIcon"),g=document.getElementById("objectivePriority"),b=document.getElementById("objectiveNotes");l&&(l.value=s.title),m&&(m.value=s.detail||""),x&&(x.value=s.area||"General"),g&&(g.value=(s.priority||2).toString()),b&&(b.value=s.notes||"");const y=document.getElementById("submitObjectiveBtn");y&&(y.textContent=a.dashboard.updateObjective),window.editingObjectiveId=c,ce();const h=document.getElementById("objectiveModal");h&&(h.style.display="flex")}}})}),t.querySelectorAll(".delete-objective").forEach(o=>{o.addEventListener("click",async n=>{n.stopPropagation(),n.preventDefault();const i=o.getAttribute("data-id");i&&await yt(Number(i))})}),t.querySelectorAll(".complete-objective").forEach(o=>{o.addEventListener("click",async n=>{n.stopPropagation(),n.preventDefault();const i=o.getAttribute("data-id");i&&await ft(Number(i))})}),t.querySelectorAll(".icon-display, .area-display").forEach(o=>{o.addEventListener("click",async n=>{const i=o.getAttribute("data-id");if(i){const c=Number(i),s=e.find(l=>l.id===c);if(s){const l=document.getElementById("objectiveTitle"),m=document.getElementById("objectiveDetail"),x=document.getElementById("objectiveArea"),p=document.getElementById("objectiveIcon"),g=document.getElementById("objectivePriority"),b=document.getElementById("objectiveNotes");l&&(l.value=s.title),m&&(m.value=s.detail||""),x&&(x.value=s.area||"General"),p&&(p.value=s.icon||"⚡"),g&&(g.value=(s.priority||2).toString()),b&&(b.value=s.notes||"");const y=document.getElementById("submitObjectiveBtn");y&&(y.textContent=a.dashboard.updateObjective),window.editingObjectiveId=c,ce();const h=document.getElementById("objectiveModal");h&&(h.style.display="flex")}}})});_()}catch(e){console.error("Error loading weekly objectives:",e)}}function gt(){const e=document.querySelectorAll("#weeklyObjectivesFilters .filter-btn");e.forEach(t=>{t.addEventListener("click",()=>{e.forEach(a=>a.classList.remove("bg-purple-500","text-white")),e.forEach(a=>a.classList.add("bg-gray-700","text-white")),t.classList.add("bg-purple-500","text-white"),Q=t.getAttribute("data-filter"),te()})}),e.forEach(t=>{t.getAttribute("data-filter")==="all"&&(t.classList.add("bg-purple-500","text-white"),t.classList.remove("bg-gray-700"))})}async function yt(e){const t=k();if(await ot(t.confirmations.deleteEventMessage,t.common.delete))try{await Qe(`/weekly-objectives/${e}/`),te()}catch(a){console.error("Error deleting objective:",a),await fe("Error al eliminar el objetivo. Por favor, intenta nuevamente.","Error")}}async function ft(e){if(Pe())try{const a=(await H("/weekly-objectives/")).find(n=>n.id===e);if(!a)return;const o=!a.is_completed;await Xe(`/weekly-objectives/${e}/`,{is_completed:o}),await te();try{document.dispatchEvent(new CustomEvent("weeklyChallenge:update"))}catch{}}catch(r){console.error("Error toggling objective completion:",r),await fe("Error al actualizar el objetivo. Por favor, intenta nuevamente.","Error")}}async function ht(){const e=document.getElementById("objectiveModal");if(e){try{const t=await H("/subjects/"),r=document.getElementById("objectiveSubject");if(r){const a=k();r.innerHTML=`<option value="">-- ${a.habits.none} --</option>`+t.map(o=>`<option value="${o.id}">${o.name}</option>`).join("")}}catch(t){console.warn("Could not load subjects for objective modal",t)}ce(),e.style.display="flex"}}function se(){const e=document.getElementById("objectiveModal");e&&(e.style.display="none");const t=document.getElementById("objectiveForm");t&&t.reset(),window.editingObjectiveId=null;const r=document.getElementById("submitObjectiveBtn");if(r){const a=k();r.textContent=a.dashboard.createObjective}}async function bt(e){e.preventDefault();const t=document.getElementById("objectiveTitle"),r=document.getElementById("objectiveDetail"),a=document.getElementById("objectiveArea"),o=document.getElementById("objectiveIcon"),n=document.getElementById("objectivePriority"),i=document.getElementById("objectiveNotes");if(!t||!t.value){alert("Por favor ingresá un título");return}try{const c={title:t.value,detail:r?.value||"",notes:i?.value||"",priority:n?.value?Number(n.value):2,area:a?.value||"General",icon:o?.value||"⚡",subject:null};console.log("Sending objective data:",c);const s=window.editingObjectiveId;s?(console.log(`Updating objective ${s}...`),await Ye(`/weekly-objectives/${s}/`,c),window.editingObjectiveId=null):(console.log("Creating new objective..."),await Oe("/weekly-objectives/",c,!0)),se(),await te();try{document.dispatchEvent(new CustomEvent("weeklyChallenge:update"))}catch{}}catch(c){console.error("Error creating/updating objective:",c),alert("Error al guardar el objetivo")}}async function he(){try{console.log("[loadWeeklyChallenge] Starting...");const e=await H("/weekly-challenge/active/");if(console.log("[loadWeeklyChallenge] Response:",e),!e){console.warn("Unexpected: Backend returned null for active challenge"),xt();return}vt(e),console.log("[loadWeeklyChallenge] Rendered UI")}catch(e){console.error("Error loading weekly challenge:",e),wt()}}let ie=null;document.addEventListener("weeklyChallenge:update",()=>{try{console.log("[loadWeeklyChallenge:listener] Event received, debouncing..."),ie&&window.clearTimeout(ie),ie=window.setTimeout(()=>{console.log("[loadWeeklyChallenge:listener] Debounce complete, loading challenge..."),he().catch(e=>console.error("Error reloading weekly challenge:",e)),ie=null},300)}catch{}});function vt(e){const t=document.querySelector("[data-challenge-container]");if(!t)return;const r=k(),a=e.status==="completed",o=a?"check-circle":"zap",n=a?"bg-green-500/20 text-green-400 border-green-500/30":"bg-purple-500/20 text-purple-400 border-purple-500/30",i=a?"from-green-500 via-emerald-500 to-green-500":"from-purple-500 via-pink-500 to-purple-500",c=a?"rgba(34,197,94,0.5)":"rgba(168,85,247,0.5)",s=`
    <span class="px-3 py-1 rounded-full text-xs font-semibold border ${n} flex items-center gap-1" style="width: fit-content;">
      <i data-lucide="${o}" class="w-3 h-3"></i>
      <span>
        ${a?r.dashboard.weeklyChallengeStatusCompleted:r.dashboard.weeklyChallengeStatusActive}
      </span>
    </span>
  `,l=r.dashboard.weeklyChallengeProgress.replace("{current}",e.current_value.toString()).replace("{target}",e.target_value.toString());t.innerHTML=`
    <div class="space-y-4">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <h3 class="text-white font-medium mb-1">${e.title}</h3>
          <p class="text-gray-500 text-sm mb-4">${e.description}</p>
        </div>
        <div class="flex-shrink-0">
          ${s}
        </div>
      </div>
      
      <div class="space-y-2">
        <div class="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
          <div class="bg-gradient-to-r ${i} h-2 rounded-full transition-all duration-500 ease-out" 
               style="width: ${Math.min(e.progress_percentage,100)}%; box-shadow: 0 0 10px ${c};">
          </div>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-xs bg-gradient-to-r ${a?"from-green-400 to-emerald-400":"from-purple-400 to-pink-400"} bg-clip-text text-transparent font-medium">
            ${l}
          </span>
          <span class="text-xs text-gray-500">${e.progress_percentage.toFixed(0)}%</span>
        </div>
      </div>

    </div>
  `,typeof lucide<"u"&&lucide.createIcons&&_();try{const m=document.querySelector("[data-challenge-container]");m&&(m.style.transition=m.style.transition||"opacity 250ms ease",m.style.opacity="1",m.style.visibility="visible",m.classList.remove("animate-fade","animated"))}catch{}}function xt(){const e=document.querySelector("[data-challenge-container]");if(!e)return;const t=k();e.innerHTML=`
    <div class="text-center py-6">
      <i data-lucide="award" class="w-8 h-8 text-gray-500 mx-auto mb-2"></i>
      <p class="text-gray-400 text-sm">${t.dashboard.weeklyChallengeEmpty}</p>
    </div>
  `,typeof lucide<"u"&&lucide.createIcons&&_()}function wt(){const e=document.querySelector("[data-challenge-container]");if(!e)return;const t=k();e.innerHTML=`
    <div class="text-center py-4">
      <p class="text-red-400 text-sm">${t.dashboard.weeklyChallengeError}</p>
    </div>
  `}async function X(){try{const e=await H("/pomodoro/"),t=(await G()).timezone||Intl.DateTimeFormat().resolvedOptions().timeZone,r=(p,g)=>new Intl.DateTimeFormat("en-CA",{timeZone:g,year:"numeric",month:"2-digit",day:"2-digit"}).format(p),a=r(new Date,t),o=e.filter(p=>{const g=new Date(p.start_time);return r(g,t)===a}),n=o.reduce((p,g)=>p+g.duration,0),i=o.length,c=ee(t),s=e.filter(p=>new Date(p.start_time)>=c).length,l=document.getElementById("sessions-today"),m=document.getElementById("minutes-today");l&&(l.textContent=i.toString()),m&&(m.textContent=n.toString());try{document.dispatchEvent(new CustomEvent("pomodoro:sessionsUpdated",{detail:{totalSessionsThisWeek:s,totalSessionsToday:i}}))}catch{}const x=document.getElementById("recent-sessions");if(x){const p=e.sort((g,b)=>new Date(b.start_time).getTime()-new Date(g.start_time).getTime()).slice(0,5);p.length===0?x.innerHTML='<p class="empty-state">No tenés sesiones de Pomodoro aún</p>':x.innerHTML=p.map(g=>{const y=new Date(g.start_time).toLocaleDateString("es-AR",{day:"numeric",month:"short"});return`
                        <div class="pomodoro-item">
                            <div class="pomodoro-info">
                                <h4>${g.duration} min</h4>
                                <span class="pomodoro-date">${y}</span>
                            </div>
                            ${g.notes?`<p class="pomodoro-notes">${g.notes}</p>`:""}
                        </div>
                    `}).join("")}}catch(e){console.error("Error loading pomodoro sessions:",e)}}function ee(e){const t=new Date(new Intl.DateTimeFormat("en-US",{timeZone:e,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!1}).format(new Date)),r=t.getDay(),a=r===0?6:r-1,o=new Date(t);return o.setDate(t.getDate()-a),o.setHours(0,0,0,0),o}async function Et(){const t=(await G()).timezone??"UTC";ee(t);try{const r=k(),a=await H("/pomodoro/"),o=ee(t),n=a.map(p=>({...p,date:new Date(p.start_time)})).filter(p=>p.date>=o),i={0:0,1:0,2:0,3:0,4:0,5:0,6:0};n.forEach(p=>{const g=p.date.getDay();i[g]+=p.duration});const c=r.dashboard.weekDaysAbbrebiation,s=[i[1],i[2],i[3],i[4],i[5],i[6],i[0]],l=Math.max(...s,1),m=document.getElementById("weekly-rhythm-chart"),x=m?.parentElement;if(m&&x){const p=x.querySelector(".absolute.bottom-0.flex");if(p&&(p.innerHTML=c.map(L=>`<span>${L}</span>`).join("")),n.length===0){const L=m;L.innerHTML=`
                    <foreignObject width="100%" height="100%">
                         <div class="flex flex-col items-center justify-center h-full pb-6">
                            <i data-lucide="bar-chart-2" class="w-8 h-8 text-gray-600 mb-2"></i>
                            <p class="text-gray-500 text-xs text-center">${r.dashboard.emptyRhythmTitle}</p>
                        </div>
                    </foreignObject>
                `,_();return}const g=m,b=m,y=Math.max(220,Math.floor(b.clientWidth||x.clientWidth||450)),h=Math.max(120,Math.floor(b.clientHeight||160)),w=8,E=8,z=28,v=Math.max(1,y-w*2)/6,$=Math.max(40,h-E-z);g.setAttribute("viewBox",`0 0 ${y} ${h}`),g.removeAttribute("preserveAspectRatio");let R="";const M=[];if(s.forEach((L,C)=>{const T=w+C*v,j=L/l,K=E+(1-j)*$;M.push({x:T,y:K})}),M.length>1){let L=`M ${M[0].x} ${M[0].y}`;for(let C=1;C<M.length;C++){const T=M[C-1],j=M[C],K=T.x+(j.x-T.x)/2,O=T.y,S=j.x-(j.x-T.x)/2,N=j.y;L+=` C ${K} ${O}, ${S} ${N}, ${j.x} ${j.y}`}R=L}else M.length===1&&(R=`M ${M[0].x} ${M[0].y}`);const W=r.dashboard.weekDays;g.innerHTML=`
                <path d="${R}" fill="none" stroke="#c084fc" stroke-width="3" />
                ${M.map((L,C)=>{const T=s[C],j=(T/60).toFixed(1);return`
                        <g>
                            <circle cx="${L.x}" cy="${L.y}" r="4" fill="#1e212b" stroke="#c084fc" stroke-width="2" 
                                    class="cursor-pointer hover:r-6 transition-all" 
                                    data-day="${W[C]}" 
                                    data-hours="${j}"
                                    data-minutes="${T}"/>
                            <title>${W[C]}: ${j}h (${T} min)</title>
                        </g>
                    `}).join("")}
            `,ct||g.querySelectorAll("circle").forEach((C,T)=>{const j=s[T],K=(j/60).toFixed(1),O=W[T];C.addEventListener("mouseenter",S=>{const N=document.createElement("div");N.id="rhythm-tooltip",N.className="fixed bg-dark-card border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white shadow-lg z-50 pointer-events-none",N.innerHTML=`
                            <div class="font-bold text-purple-400">${O}</div>
                            <div class="text-gray-300">${K}h (${j} min)</div>
                        `,document.body.appendChild(N),Ce(N,S.clientX,S.clientY)}),C.addEventListener("mouseleave",()=>{const S=document.getElementById("rhythm-tooltip");S&&S.remove()}),C.addEventListener("mousemove",S=>{const N=document.getElementById("rhythm-tooltip");N&&Ce(N,S.clientX,S.clientY)})})}}catch(r){console.error("Error loading weekly study rhythm:",r)}}async function _e(){const e=k();try{const r=(await G()).timezone??"UTC",a=await H("/pomodoro/"),o=await H("/subjects/"),n=ee(r),i=a.filter(y=>new Date(y.start_time)>=n),c={};let s=0;i.forEach(y=>{let h=null;y.subject!==null&&y.subject!==void 0&&(h=typeof y.subject=="string"?parseInt(y.subject):y.subject);const w=h!==null&&!isNaN(h)?h:-1;c[w]||(c[w]=0),c[w]+=y.duration,s+=y.duration});const l=Object.entries(c).filter(([y,h])=>h>0).map(([y,h])=>{const w=parseInt(y);let E=e.dashboard.focusDistributionNoSubject;if(w!==-1){const z=o.find(q=>q.id===w);E=z?z.name:`Materia ${w}`}return{id:w,name:E,minutes:h,percentage:s>0?h/s*100:0}}).sort((y,h)=>h.minutes-y.minutes),m=["#a855f7","#60a5fa","#34d399","#fbbf24","#ec4899","#8b5cf6"];let x=0;const p=l.map((y,h)=>{const w=m[h%m.length],E=x;return x+=y.percentage,`${w} ${E}% ${x}%`}).join(", "),g=document.getElementById("focus-distribution-chart"),b=g?.parentElement;if(g&&b){if(i.length===0||l.length===0){b.innerHTML=`
                    <div class="flex flex-col items-center justify-center h-full py-8">
                        <i data-lucide="pie-chart" class="w-12 h-12 text-gray-600 mb-3"></i>
                        <p class="text-gray-500 text-sm text-center">${e.dashboard.emptyDistributionTitle}</p>
                        <p class="text-gray-600 text-xs text-center mt-1">${e.dashboard.emptyDistributionDesc}</p>
                    </div>
                `,_();return}g.style.background=`conic-gradient(${p})`;const y=document.getElementById("focus-total-hours");if(y)if(s<60)y.textContent=`${s}m`;else{const w=Math.floor(s/60),E=s%60;y.textContent=E===0?`${w}h`:`${w}h ${E}m`}const h=document.getElementById("focus-legend");h&&(h.innerHTML=l.slice(0,4).map((w,E)=>`
                        <div class="flex items-center gap-1">
                            <span class="w-2 h-2 rounded-full" style="background-color: ${m[E%m.length]}"></span>
                            <span class="text-[10px] text-gray-400">${w.name}</span>
                        </div>
                    `).join(""))}}catch(t){console.error("Error loading focus distribution:",t)}}async function kt(){try{const e=k(),t=28,r=3,a=60,n=(await G()).timezone??"UTC",i=await H("/pomodoro/"),c=new Date;let s=ee(n);s.setDate(s.getDate()-21);const l=i.map(v=>({...v,date:new Date(v.start_time)})).filter(v=>!v||!v.start_time||typeof v.duration!="number"||isNaN(v.date.getTime())||v.date>c||v.duration<=0?!1:v.date>=s),m=()=>{const v=document.getElementById("peak-productivity-time");v&&(v.textContent=e.dashboard.emptyPeakProductivityTitle);const $=document.getElementById("peak-productivity-desc");$&&($.textContent=e.dashboard.emptyPeakProductivityDesc)};if(l.length<r){m();return}if(l.reduce((v,$)=>v+$.duration,0)<a){m();return}const p={};l.forEach(v=>{const $=v.date.getDay(),R=v.date.getHours();p[$]??={},p[$][R]=(p[$][R]||0)+v.duration});let g=-1,b=-1,y=0;if(Object.entries(p).forEach(([v,$])=>{Object.entries($).forEach(([R,M])=>{M>y&&(y=M,g=Number(v),b=Number(R))})}),g===-1||b===-1){m();return}const h=Math.max(0,b-1),w=Math.min(23,b+1),E=v=>`${v.toString().padStart(2,"0")}:00`,z=document.getElementById("peak-productivity-time");if(z){const v=e.dashboard.days[g];z.textContent=`${v}, ${E(h)} - ${E(w)}`}const q=document.getElementById("peak-productivity-desc");q&&(q.textContent=e.dashboard.peakProductivityAnalysisDesc)}catch(e){console.error("Error loading peak productivity:",e)}}function Ce(e,t,r){const a=e.getBoundingClientRect(),o=15;let n=t+o,i=r-a.height-o;n+a.width>window.innerWidth-10&&(n=t-a.width-o),n<10&&(n=10),i<10&&(i=r+o),i+a.height>window.innerHeight-10&&(i=window.innerHeight-a.height-10),e.style.left=`${n}px`,e.style.top=`${i}px`}async function St(e,t){const r=Pe();if(r)try{const a=document.querySelector(`[data-habit-id="${e}"]`)?.closest(".flex.items-center.justify-between");if(a){const i=a.querySelector(".w-6.h-6.rounded"),c=a.querySelector(".flex.items-center.gap-2"),s=a.querySelector(".text-xs")?.parentElement;i&&c&&(t?(i.className="w-6 h-6 rounded bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-purple-500/20 flex items-center justify-center",i.style.boxShadow="0 0 0 1px rgba(168,85,247,0.3)",i.innerHTML='<i data-lucide="check" class="w-4 h-4 text-purple-400"></i>',c.className="flex items-center gap-2 text-gray-400 line-through"):(i.className="w-6 h-6 rounded border border-gray-600 flex items-center justify-center group-hover:border-purple-500",i.style.boxShadow="",i.innerHTML="",c.className="flex items-center gap-2 text-gray-300 font-medium"),_())}const o=await fetch(`${et}/habits/${e}/complete/`,{method:t?"POST":"DELETE",headers:{"Content-Type":"application/json",Authorization:`Token ${r}`}});if(!o.ok)throw new Error("API Error");const n=await o.json();if(n.streak!==void 0&&a){const i=a.querySelector(".text-xs")?.textContent;if(i&&i.match(/\d+/)){const s=a.querySelector(".text-xs");s&&(s.innerHTML=`<i data-lucide="trending-up" class="w-3 h-3"></i> ${n.streak}`,_())}}ye()}catch(a){console.error("Error toggling habit:",a),alert("Error de conexión. No se guardó."),ye()}}async function ye(){try{const e=k(),r=(await H("/habits/")).filter(l=>l.is_key),a=document.getElementById("key-habits-container");if(!a)return;if(r.length===0){a.innerHTML=`
                <div class="text-center py-8 text-gray-500">
                    <i data-lucide="target" class="w-8 h-8 mx-auto mb-2 text-gray-600"></i>
                    <p class="text-sm">${e.dashboard.emptyKeyHabitsTitle}</p>
                    <p class="text-xs mt-1">${e.dashboard.emptyKeyHabitsDesc}</p>
                </div>
            `,_();return}const o=[...r].sort((l,m)=>m.streak-l.streak),n=o.filter(l=>l.completed_today).length,i=o.length>0?Math.round(n/o.length*100):0;a.innerHTML=o.map(l=>{const m=l.completed_today;return`
                <div class="flex items-center justify-between bg-dark-input p-4 rounded-xl relative group transition-all duration-300" 
                    style="box-shadow: 0 0 0 1px rgba(168,85,247,0.15), 0 0 15px rgba(168,85,247,0.08);"
                    data-habit-id="${l.id}">
                    <div class="flex items-center gap-4 flex-1">
                        <button class="habit-complete-btn w-6 h-6 rounded ${m?"bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-purple-500/20 flex items-center justify-center cursor-pointer":"border border-gray-600 flex items-center justify-center group-hover:border-purple-500 cursor-pointer transition-all"}" 
                            style="${m?"box-shadow: 0 0 0 1px rgba(168,85,247,0.3);":""}"
                            data-habit-id="${l.id}"
                            data-completed="${m}"
                            title="${m?"Marcar como no completado":"Marcar como completado"}">
                            ${m?'<i data-lucide="check" class="w-4 h-4 text-purple-400"></i>':""}
                        </button>
                        <div class="flex items-center gap-2 ${m?"text-gray-400 line-through":"text-gray-300 font-medium"}">
                            <i data-lucide="target" class="w-4 h-4 text-purple-400"></i>
                            ${l.name}
                        </div>
                    </div>
                    <div class="flex items-center gap-1 text-xs bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        <i data-lucide="trending-up" class="w-3 h-3"></i>
                        <p class="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-semibold">
                            ${e.dashboard.keyHabitsStreak||"Streak:"} ${l.streak}
                        </p>
                    </div>
                </div>
            `}).join(""),a.querySelectorAll(".habit-complete-btn").forEach(l=>{l.addEventListener("click",async m=>{m.stopPropagation();const x=m.currentTarget,p=Number(x.getAttribute("data-habit-id")),g=x.getAttribute("data-completed")==="true";await St(p,!g)})});const c=document.getElementById("daily-progress-bar"),s=document.getElementById("daily-progress-text");c&&(c.style.width=`${i}%`),s&&(s.textContent=`${i}%`),_()}catch(e){console.error("Error loading key habits:",e)}}async function Tt(){const e=k(),t=document.getElementById("nextEventContainer");if(t)try{const r=await Ve(),a=new Date,o=r.filter(b=>new Date(`${b.date}T${b.start_time}`)>a).sort((b,y)=>{const h=new Date(`${b.date}T${b.start_time}`),w=new Date(`${y.date}T${y.start_time}`);return h.getTime()-w.getTime()});if(o.length===0){t.innerHTML=`
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
            `,_();return}const n=o[0],i=n.start_time.substring(0,5),c=n.end_time.substring(0,5),s=typeof Z=="function"?Z():"es",l=new Date(`${n.date}T00:00:00`),m=new Date;m.setHours(0,0,0,0);let x;if(l.getTime()===m.getTime())x={es:"Hoy",en:"Today",pt:"Hoje",zh:"今天"}[s]||"Hoy";else{const b=l.toLocaleDateString(s,{weekday:"short",day:"numeric",month:"short"});x=b.charAt(0).toUpperCase()+b.slice(1)}const p={1:e.dashboard.eventTypeStudyBlock,2:e.dashboard.eventTypeExam,3:e.dashboard.eventTypeImportantTask,4:e.dashboard.eventTypePersonal},g=n.type===2?"exam":n.type===3?"task":n.type===4?"personal":"";t.innerHTML=`
            <div class="space-y-4">
                <div class="event-item ${g} p-4">
                    <div class="mb-2">
                        <span class="inline-flex text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400 mb-2">${p[n.type]||"Evento"}</span>
                        <h3 class="text-lg font-bold text-white leading-tight">${n.title}</h3>
                    </div>
                    <div class="flex items-center gap-4 text-sm text-gray-400">
                        <div class="flex items-center gap-1">
                            <i data-lucide="calendar" class="w-4 h-4"></i>
                            <span class="font-medium text-purple-300">${x}</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <i data-lucide="clock" class="w-4 h-4"></i>
                            <span>${i} - ${c}</span>
                        </div>
                    </div>
                    ${n.notes?`<p class="text-sm text-gray-500 mt-2">${n.notes}</p>`:""}
                </div>
                <a href="/planner" class="block text-center text-sm text-purple-400 hover:text-purple-300 transition-colors">
                    ${e.dashboard.plannerFull}
                </a>
            </div>
        `,_()}catch(r){console.error("Error loading next event:",r);const a=k();t.innerHTML=`
            <div class="flex flex-col items-center justify-center py-8">
                <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-purple-500/20 flex items-center justify-center mb-4" style="box-shadow: 0 0 0 1px rgba(168,85,247,0.3);">
                    <i data-lucide="calendar-x" class="w-8 h-8 text-purple-400"></i>
                </div>
                <h3 class="text-lg font-bold text-white mb-2">${a.dashboard.emptyNextEventTitle}</h3>
                <p class="text-gray-400 text-sm mb-4 text-center">${a.dashboard.emptyNextEventDesc}</p>
                <a href="/planner" class="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 text-purple-400 text-sm hover:from-purple-500/30 hover:via-pink-500/30 hover:to-purple-500/30 transition-all border border-purple-500/30 inline-flex items-center gap-2">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    <span>${a.dashboard.emptyNextEventAction}</span>
                </a>
            </div>
        `,_()}}async function It(){const e=document.getElementById("dashboard-content");e&&(e.innerHTML='<p class="loading">Cargando datos del dashboard...</p>');try{try{const r=await G(),a=r.language||r.preferences?.language;a&&a!==Z()&&(nt(a),ce())}catch{}dt();const t=document.getElementById("pomodoroTagline");if(t){const r=Z(),a={es:"Define tu ritmo. Domina tu tiempo.",en:"Set your rhythm. Master your time.",zh:"设定你的节奏，掌控你的时间。",pt:"Defina seu ritmo. Domine seu tempo."};t.textContent=a[r]||a.es}await Promise.all([mt(),pt(),X(),te(),he(),ye(),Tt()]),lt(()=>{Promise.all([Et(),_e(),kt()])}),e&&(e.style.display="none")}catch(t){console.error("Error loading dashboard:",t),e&&(e.innerHTML='<p class="error-state">Error al cargar el dashboard. Por favor, recargá la página.</p>')}}let De=!1;function Le(){if(De)return;De=!0,tt(),gt(),It();const e=document.getElementById("addObjectiveBtn");e&&e.addEventListener("click",ht);const t=document.getElementById("closeObjectiveModalBtn");t&&t.addEventListener("click",se);const r=document.getElementById("cancelObjectiveBtn");r&&r.addEventListener("click",se);const a=document.getElementById("objectiveForm");a&&a.addEventListener("submit",bt);const o=document.getElementById("objectiveModal");o&&o.addEventListener("click",n=>{n.target===o&&se()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Le,{once:!0}):Le();(()=>{let t={...{workMinutes:25,shortBreakMinutes:5,longBreakMinutes:15,cyclesBeforeLongBreak:4}},r=null,a=!1,o=t.workMinutes*60,n="work",i=!1,c=0,s={totalSessionsThisWeek:0,sessionsToday:0},l=Intl.DateTimeFormat().resolvedOptions().timeZone,m=null,x=null,p=null,g=null,b=null,y=null,h=0,w=null;window.__studyoCaptureFocusState=()=>{try{return{type:"pomodoro",isRunning:i,remainingSeconds:o,currentStage:n,timerStartTime:y,timerStartRemaining:h,settings:{...t},defaultSubjectId:g,completedCycles:c,sessionStart:p?p.toISOString():null,capturedAt:new Date().toISOString()}}catch{return null}};let E=null,z=!1;const q=document.getElementById("pomodoroProgressCircle"),v=document.getElementById("pomodoroTimerDisplay"),$=document.getElementById("pomodoroStageLabel"),R=document.getElementById("pomodorosCount"),M=document.getElementById("pomodoroSetLabel"),W=document.getElementById("pomodoroPlayBtn"),L=document.getElementById("pomodoroSkipBtn"),C=document.getElementById("pomodoroResetBtn"),T=document.getElementById("pomodoroSettingsBtn"),j=document.getElementById("pomodoroTooltip"),K=document.getElementById("closePomodoroTooltip");let O=null;const S=document.getElementById("pomodoroSettingsModal"),N=document.getElementById("pomodoroSettingsForm"),oe=document.getElementById("workMinutes"),ne=document.getElementById("shortBreakMinutes"),ae=document.getElementById("longBreakMinutes"),re=document.getElementById("cyclesBeforeLongBreak"),Y=document.getElementById("pomodoroDefaultSubjectSelect"),be=document.getElementById("pomodoroSettingsCancel"),He=552;function Ne(){if(pe()?.active||!j||localStorage.getItem("studyo_onboarding_done"))return;setTimeout(()=>{localStorage.getItem("studyo_onboarding_done")||j.classList.remove("hidden")},2e3);const d=()=>{j.classList.add("hidden"),localStorage.setItem("studyo_onboarding_done","true")};K?.addEventListener("click",f=>{f.stopPropagation(),d()}),T?.addEventListener("click",d)}function le(){const u=pe();if(!u||!u.active){O=null,U();return}if(O=u.step,O==="CREATE_SUBJECT"){J({title:k().onboarding?.stepCreateSubjectTitle||"Paso 1: Creá tu primera asignatura",body:k().onboarding?.stepCreateSubjectBody||"Creá 1 asignatura para activar el tracking real de tu estudio.",primaryText:k().onboarding?.createSubject||"Crear asignatura",primaryHref:"/subjects",lockClose:!0,allowSkip:!0,onSkip:async()=>{try{await Be()}catch{}U()}});return}if(O==="CREATE_HABIT"){J({title:k().onboarding?.stepCreateHabitTitle||"Paso 2: Creá un hábito",body:k().onboarding?.stepCreateHabitBody||"Ahora creá un hábito y revisá “Hábito clave”.",primaryText:k().onboarding?.goToHabits||"Ir a hábitos",primaryHref:"/habits",lockClose:!0,allowSkip:!0,onSkip:async()=>{try{await Be()}catch{}U()}});return}if(O==="CONFIG_POMODORO"){J({title:k().onboarding?.stepConfigPomodoroTitle||"Paso 3: Configurá Pomodoro",body:k().onboarding?.stepConfigPomodoroBody||"Definí una materia por defecto para registrar bien tus sesiones.",primaryText:k().dashboard.pomodoroSettings,lockClose:!0,onPrimary:()=>{U(),T?.dispatchEvent(new Event("click"))}});return}if(O==="START_SESSION"){g?J({title:"Paso 4: Iniciá tu primera sesión.",body:'¡Todo listo! Presioná "Empezar ahora" para terminar el onboarding y continuar libremente.',primaryText:"Empezar ahora",lockClose:!0,onPrimary:async()=>{try{await it(),O="DONE",U();try{fe("Onboarding completado. Ya podes explorar StudyO libremente.")}catch{}}catch(d){console.warn("onboarding completion failed",d)}}}):J({title:"SeleccionÃ¡ una asignatura",body:"Antes de iniciar tu primera sesiÃ³n, elegÃ­ una materia en los ajustes de Pomodoro.",primaryText:"Ir a ajustes",lockClose:!0,onPrimary:()=>{U(),T?.dispatchEvent(new Event("click"))}});return}U()}function Ae(){try{const u=localStorage.getItem("pomodoroSettings");if(u){const d=JSON.parse(u);t={...t,...d},typeof d.defaultSubjectId=="number"&&(g=d.defaultSubjectId)}}catch{}}function ze(){E||(E=new Audio("/sounds/pomodoroSound.mp3"),E.volume=.8,E.play().then(()=>{E.pause(),E.currentTime=0}).catch(()=>{}))}function Re(){localStorage.setItem("pomodoroSettings",JSON.stringify({...t,defaultSubjectId:g}))}function Fe(u){const d=Math.floor(u/60).toString().padStart(2,"0"),f=Math.floor(u%60).toString().padStart(2,"0");return`${d}:${f}`}function V(u,d){return new Intl.DateTimeFormat("en-CA",{timeZone:d,year:"numeric",month:"2-digit",day:"2-digit"}).format(u)}function F(){if(v&&(v.textContent=Fe(o)),$){const u=Z(),d={es:"Enfoque",en:"Focus",zh:"专注",pt:"Foco"},f={es:"Descanso corto",en:"Short break",zh:"短休息",pt:"Pausa curta"},D={es:"Descanso largo",en:"Long break",zh:"长休息",pt:"Pausa longa"};n==="work"?$.textContent=d[u]||d.es:n==="short_break"?$.textContent=f[u]||f.es:$.textContent=D[u]||D.es}if(q){const u=(n==="work"?t.workMinutes:n==="short_break"?t.shortBreakMinutes:t.longBreakMinutes)*60,d=Math.max(0,Math.min(1,1-o/u)),f=Math.round(He*(1-d));q.style.strokeDashoffset=`${f}`}try{const u=Z(),d={es:"Pomodoros",en:"Pomodoros",zh:"番茄钟",pt:"Pomodoros"},f={es:"Set: {current} / {total}",en:"Set: {current} / {total}",zh:"组: {current} / {total}",pt:"Conjunto: {current} / {total}"};try{const I=s.sessionsToday||0;if(R&&(R.textContent=`${d[u]||d.es}: ${I}`),M){const A=Math.max(1,t.cyclesBeforeLongBreak);let B=I%A;B===0&&I>0&&(B=A);const P=f[u]||f.es;M.textContent=P.replace("{current}",String(B)).replace("{total}",String(A))}}catch{}}catch{}}document.addEventListener("pomodoro:completed",()=>{try{X().catch(u=>console.warn("refresh stats failed",u)),he().catch(u=>console.warn("refresh weekly challenge failed",u))}catch{}}),document.addEventListener("pomodoro:sessionsUpdated",async u=>{try{const d=u,f=Number(d.detail?.totalSessionsThisWeek)||0,D=Number(d.detail?.totalSessionsToday)||0;let I=l;try{I=(await G()).timezone||I,l=I}catch{}const A=V(new Date,I),B="pomodoroReset";let P={};try{P=JSON.parse(localStorage.getItem(B)||"{}")}catch{P={}}P.day!==A&&(P={},localStorage.removeItem(B));const me=Number(P.offset||0),Te=Math.max(0,D-me);s.rawTotalSessionsThisWeek=f,s.rawSessionsToday=D,s.totalSessionsThisWeek=f,s.sessionsToday=Te,c=Te,F()}catch{}});function ve(){if(E)try{E.currentTime=0,E.play().catch(()=>{})}catch(u){console.warn("Audio not available",u)}}function de(){if(!i||y===null)return;const u=Date.now(),d=Math.floor((u-y)/1e3),f=Math.max(0,h-d);f!==o&&(o=f,F()),o<=0&&qe()}async function qe(){if(!a){a=!0;try{if(ve(),document.visibilityState!=="visible"&&Ke(),r&&(clearInterval(r),r=null),n==="work"&&p){const u=new Date;let d=Math.round((u.getTime()-p.getTime())/6e4);d=Math.max(1,d);try{console.log("[finishTimer] Pomodoro finished - creating session",{start:p.toISOString(),end:u.toISOString(),duration:d,subject:g});const f=await ke(p,u,d,g);console.log("[finishTimer] Pomodoro POST completed",f)}catch(f){console.error("[finishTimer] Error saving pomodoro session",f)}p=null}Ee(),o=(n==="work"?t.workMinutes:n==="short_break"?t.shortBreakMinutes:t.longBreakMinutes)*60,y=Date.now(),h=o,n==="work"&&!p&&(console.log("[finishTimer] Entering work stage - initializing sessionStart"),p=new Date),r=window.setInterval(()=>{de()},1e3),F()}finally{a=!1}}}async function We(){if(!i){if((O==="CONFIG_POMODORO"||O==="START_SESSION")&&!g){J({title:"Seleccioná una asignatura",body:"Durante el onboarding no se puede iniciar pomodoro sin materia asignada.",primaryText:"Configurar ahora",lockClose:!0,onPrimary:()=>{U(),T?.dispatchEvent(new Event("click"))}});return}i=!0,ue(),ze(),Ge(),!p&&n==="work"&&(p=new Date),y=Date.now(),h=o,b=u=>{u.preventDefault();const d=Z(),f={es:"El Pomodoro se detendrá si abandonas esta página. ¿Estás seguro?",en:"The Pomodoro will stop if you leave this page. Are you sure?",zh:"离开此页面将停止番茄钟，确定继续吗？",pt:"O Pomodoro será interrompido se você sair desta página. Tem certeza?"};return u.returnValue=f[d]||f.es,u.returnValue},window.addEventListener("beforeunload",b),w||(w=()=>{!document.hidden&&i&&de()},document.addEventListener("visibilitychange",w)),r=window.setInterval(()=>{de()},1e3)}}function xe(){r&&(clearInterval(r),r=null),i=!1,y=null,ue(),b&&(window.removeEventListener("beforeunload",b),b=null)}function we(u=null){xe(),u&&(n=u),o=(n==="work"?t.workMinutes:n==="short_break"?t.shortBreakMinutes:t.longBreakMinutes)*60,p=null,y=null,h=0,F()}function Ue(){if(r&&(clearInterval(r),r=null),n==="work"&&p){const u=new Date,d=Math.max(1,Math.round((u.getTime()-p.getTime())/6e4));ke(p,u,d,g).catch(f=>console.error(f)),p=null}ve(),i=!1,ue(),Ee()}function Ee(){n==="work"?c>0&&c%t.cyclesBeforeLongBreak===0?n="long_break":n="short_break":n="work",o=(n==="work"?t.workMinutes:n==="short_break"?t.shortBreakMinutes:t.longBreakMinutes)*60,F()}function Ge(){z||(z=!0,"Notification"in window&&Notification.permission==="default"&&Notification.requestPermission())}function Ke(){"Notification"in window&&Notification.permission==="granted"&&new Notification("StudyO",{body:"Pomodoro finalizado.¡Hora de un descanso!",silent:!1})}async function ke(u,d,f,D){try{const I={start_time:u.toISOString(),end_time:d.toISOString(),duration:f};D!==null&&!isNaN(D)&&(I.subject=Number(D)),console.log("[saveWorkSession] Saving pomodoro:",I);const A=await Oe("/pomodoro/",I,!0);console.log("[saveWorkSession] Pomodoro saved successfully",A),console.log("[saveWorkSession] Pomodoro POST sent");try{document.dispatchEvent(new CustomEvent("pomodoro:completed"))}catch{}try{document.dispatchEvent(new CustomEvent("weeklyChallenge:update"))}catch{}await X().catch(B=>console.warn("refresh stats failed",B)),await _e().catch(B=>console.warn("refresh distribution failed",B));try{F()}catch{}return A}catch(I){throw console.error("Failed to save pomodoro session",I),I}}async function Se(){if(Y)try{const u=k(),d=await H("/subjects/");Y.innerHTML=`<option value="" data-i18n="dashboard.noPomodoroSubject">${u.dashboard.noPomodoroSubject}</option>`+d.map(f=>`<option value="${f.id}">${f.name}</option>`).join(""),g&&(Y.value=g.toString())}catch(u){console.warn("Could not load subjects",u)}}function ue(){W&&(W.innerHTML=i?'<i data-lucide="pause" class="w-5 h-5"></i>':'<i data-lucide="play" class="w-5 h-5 ml-1"></i>',_())}document.addEventListener("DOMContentLoaded",async()=>{await at(),rt(()=>le()),Ae(),Ne();try{l=(await G()).timezone||l}catch{}m=V(new Date,l),x||(x=window.setInterval(async()=>{try{const d=V(new Date,l);m!==d&&(m=d,localStorage.removeItem("pomodoroReset"),await X(),F())}catch{}},30*1e3)),o=t.workMinutes*60,F(),W&&W.addEventListener("click",async()=>{i?xe():await We()}),L&&L.addEventListener("click",()=>Ue()),C&&C.addEventListener("click",async()=>{try{c=0,we("work"),F();try{const d=await H("/pomodoro/");let f=l;try{f=(await G()).timezone||f,l=f}catch{}const D=V(new Date,f),I=d.filter(P=>{const me=new Date(P.start_time);return V(me,f)===D}).length,A="pomodoroReset",B={day:D,offset:I};localStorage.setItem(A,JSON.stringify(B)),console.log("[reset] Stored reset offset",B),c=0,F(),await X();try{document.dispatchEvent(new CustomEvent("weeklyChallenge:update"))}catch{}}catch(d){console.warn("Could not persist reset offset",d)}}catch(d){console.error("Reset failed",d)}}),T&&S&&T.addEventListener("click",async d=>{d.preventDefault(),!document.body.classList.contains("concentration-mode")&&(oe&&(oe.value=String(t.workMinutes)),ne&&(ne.value=String(t.shortBreakMinutes)),ae&&(ae.value=String(t.longBreakMinutes)),re&&(re.value=String(t.cyclesBeforeLongBreak)),await Se(),S.style.display="flex",_())}),be&&S&&be.addEventListener("click",()=>{S.style.display="none"});const u=document.getElementById("pomodoroSettingsCloseBtn");u&&S&&u.addEventListener("click",()=>{S.style.display="none"}),S&&S.addEventListener("click",d=>{d.target===S&&(S.style.display="none")}),N&&S&&N.addEventListener("submit",d=>{d.preventDefault();const f=Number(oe&&oe.value||t.workMinutes),D=Number(ne&&ne.value||t.shortBreakMinutes),I=Number(ae&&ae.value||t.longBreakMinutes),A=Number(re&&re.value||t.cyclesBeforeLongBreak);t.workMinutes=Math.max(1,f),t.shortBreakMinutes=Math.max(1,D),t.longBreakMinutes=Math.max(1,I),t.cyclesBeforeLongBreak=Math.max(1,A);const B=Y?Y.value:"";g=B?Number(B):null,O==="CONFIG_POMODORO"&&g&&st("START_SESSION").then(()=>{const P=pe();P&&(P.step="START_SESSION"),O="START_SESSION",le()}).catch(()=>{}),Re(),i||we("work"),S.style.display="none",F()}),Se(),le()})})();
