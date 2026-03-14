import"./modulepreload-polyfill-B5Qt9EMX.js";import{a as F,i as T,c as D,f as P,B as A,j as _}from"./auth-gate-BmIZwCWq.js";import{i as H,s as c,a as G}from"./confirmModal-FpVZ3sWw.js";import{t as y}from"./responsive-s2kymlAu.js";document.addEventListener("DOMContentLoaded",function(){const e=document.getElementById("logoutBtn");e&&e.addEventListener("click",async o=>{o.preventDefault();try{await F(),window.location.href="/"}catch(t){console.error("Error al cerrar sesión:",t),window.location.href="/"}})});T({loginPath:"/login"});const N=50*1024*1024;let L=[],h=[];const j=document.getElementById("addBookBtn"),$=document.getElementById("emptyStateAddBtn"),i=document.getElementById("bookModal"),M=document.getElementById("closeBookModalBtn"),S=document.getElementById("cancelBookBtn"),s=document.getElementById("bookForm"),n=document.getElementById("booksGrid"),g=document.getElementById("emptyState"),x=document.getElementById("bookSubject"),f=document.getElementById("bookFile");function I(){!i||!s||(s.reset(),i.classList.add("active"))}function m(){i&&i.classList.remove("active")}function C(e){return e.name.toLowerCase().endsWith(".pdf")?e.type!=="application/pdf"?"El archivo debe ser un PDF válido.":e.size>N?"El archivo supera el límite de 50MB.":null:"Solo se permiten archivos PDF."}async function O(){try{if(L=await D("/subjects/"),!x)return;x.innerHTML='<option value="">Selecciona una materia</option>',L.forEach(e=>{const o=document.createElement("option");o.value=String(e.id),o.textContent=e.name,x.appendChild(o)})}catch(e){console.error("Error loading subjects:",e)}}async function v(){try{h=await D("/books/"),z()}catch(e){console.error("Error loading books:",e),n&&(n.innerHTML='<p class="text-red-400 col-span-full">Error loading books</p>')}}function z(){if(!n||!g)return;const o=y().reading||{};if(h.length===0){n.innerHTML="",n.classList.add("hidden"),g.classList.remove("hidden");return}g.classList.add("hidden"),n.classList.remove("hidden"),n.innerHTML=h.map(t=>{const r=Math.round((t.progress||0)*100),a=t.subject?t.subject.name:o.noSubject||"Sin materia",p=t.note?`<p class="text-xs text-gray-400 mt-3">${t.note}</p>`:"",d=t.completed?`<span class="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-green-500/15 text-green-300">${o.completed||"Completado"}</span>`:"";return`
                <div class="bg-dark-card rounded-2xl p-6 relative group" style="box-shadow: 0 0 0 1px rgba(168,85,247,0.2), 0 0 30px rgba(168,85,247,0.15), inset 0 0 20px rgba(168,85,247,0.03);">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-start gap-3">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 via-fuchsia-500/30 to-purple-500/30 flex items-center justify-center flex-shrink-0" style="box-shadow: 0 0 0 1px rgba(168,85,247,0.3);">
                                <i data-lucide="book" class="w-5 h-5 text-purple-400"></i>
                            </div>
                            <div class="flex-1">
                                <h3 class="text-xl font-bold text-white">${t.title}</h3>
                                <p class="text-sm text-gray-400 mt-1">${t.author}</p>
                                <p class="text-xs text-gray-500 mt-1">${a}</p>
                            </div>
                        </div>
                        ${d}
                    </div>

                    <div class="mb-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs text-gray-400">${o.progressLabel||"Progreso"}</span>
                            <span class="text-sm font-bold text-purple-400">${r}%</span>
                        </div>
                        <div class="text-xs text-gray-400 mb-2">${t.last_page_read} / ${t.total_pages} ${o.pagesLabel||"páginas"}</div>
                        <div class="w-full h-2 rounded-full bg-gray-700/50" style="box-shadow: inset 0 0 10px rgba(0,0,0,0.3);">
                            <div class="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300" style="width: ${r}%; box-shadow: 0 0 15px rgba(168,85,247,0.6);"></div>
                        </div>
                        ${p}
                    </div>

                    <div class="flex gap-3 pt-4 border-t border-gray-700/50">
                        <a href="/reading/viewer/${t.id}" class="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-gray-700 text-gray-300 hover:text-white text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2">
                            <i data-lucide="book-open" class="w-4 h-4"></i>
                            <span>${o.openBook||"Abrir libro"}</span>
                        </a>
                        <button class="delete-book-btn flex-1 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2" data-book-id="${t.id}">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                            <span>${o.deleteBook||"Eliminar"}</span>
                        </button>
                    </div>
                </div>
            `}).join(""),typeof lucide<"u"&&lucide.createIcons(),U()}function U(){n&&n.addEventListener("click",async e=>{const t=e.target.closest(".delete-book-btn");if(!t)return;const r=t.dataset.bookId;!r||!await G("¿Eliminar este libro y su PDF?","Eliminar libro")||await q(Number(r))})}async function q(e){try{await _(`/books/${e}/`),await v()}catch(o){console.error("Error deleting book:",o);const r=y().reading||{};await c(r.deleteError||"No se pudo eliminar el libro.")}}async function R(e){if(e.preventDefault(),!s)return;const o=s.querySelector("button[type='submit']"),t=document.getElementById("submitBookBtnText"),a=y().reading||{},p=t?t.textContent:"";o&&(o.disabled=!0),t&&(t.textContent=a.uploading||"Subiendo...");try{const d=P();if(!d)throw new Error("User not authenticated");const u=new FormData(s),E=u.get("subject");(E===""||E===null)&&u.delete("subject");const w=u.get("file");if(!w)throw new Error(a.selectPdfError||"Debes seleccionar un PDF.");const B=C(w);if(B){await c(B);return}const k=await fetch(`${A}/books/`,{method:"POST",headers:{Authorization:`Token ${d}`},body:u,credentials:"include"});if(!k.ok){let b=a.uploadError||"Error al subir el libro.";try{const l=await k.json();l&&l.file&&(b=l.file),l&&l.detail&&(b=l.detail)}catch{}await c(b);return}m(),await v()}catch(d){console.error("Error uploading book:",d),await c(a.uploadError||"No se pudo subir el libro.")}finally{o&&(o.disabled=!1),t&&(t.textContent=p||a.uploadBook||"Subir libro")}}function V(){j&&j.addEventListener("click",I),$&&$.addEventListener("click",I),M&&M.addEventListener("click",m),S&&S.addEventListener("click",m),i&&i.addEventListener("click",e=>{e.target===i&&m()}),s&&s.addEventListener("submit",R),f&&f.addEventListener("change",()=>{const e=f.files?.[0];if(!e)return;const o=C(e);o&&(c(o),f.value="")})}window.addEventListener("DOMContentLoaded",async()=>{H(),V(),await O(),await v()});
