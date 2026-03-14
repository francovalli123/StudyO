import"./modulepreload-polyfill-B5Qt9EMX.js";import{a as C,i as F,c as I,f as T,B as P,j as A}from"./auth-gate-BmIZwCWq.js";import{i as _,s as c,a as H}from"./confirmModal-Dvwnx4q5.js";import{t as h}from"./responsive-Bo8QNGoF.js";document.addEventListener("DOMContentLoaded",function(){const e=document.getElementById("logoutBtn");e&&e.addEventListener("click",async o=>{o.preventDefault();try{await C(),window.location.href="/"}catch(t){console.error("Error al cerrar sesión:",t),window.location.href="/"}})});F({loginPath:"/login"});const G=50*1024*1024;let k=[],x=[];const L=document.getElementById("addBookBtn"),$=document.getElementById("emptyStateAddBtn"),i=document.getElementById("bookModal"),M=document.getElementById("closeBookModalBtn"),S=document.getElementById("cancelBookBtn"),s=document.getElementById("bookForm"),n=document.getElementById("booksGrid"),b=document.getElementById("emptyState"),g=document.getElementById("bookSubject"),u=document.getElementById("bookFile");function j(){!i||!s||(s.reset(),i.classList.add("active"))}function f(){i&&i.classList.remove("active")}function D(e){return e.name.toLowerCase().endsWith(".pdf")?e.type!=="application/pdf"?"El archivo debe ser un PDF válido.":e.size>G?"El archivo supera el límite de 50MB.":null:"Solo se permiten archivos PDF."}async function N(){try{if(k=await I("/subjects/"),!g)return;g.innerHTML='<option value="">Selecciona una materia</option>',k.forEach(e=>{const o=document.createElement("option");o.value=String(e.id),o.textContent=e.name,g.appendChild(o)})}catch(e){console.error("Error loading subjects:",e)}}async function y(){try{x=await I("/books/"),O()}catch(e){console.error("Error loading books:",e),n&&(n.innerHTML='<p class="text-red-400 col-span-full">Error loading books</p>')}}function O(){if(!n||!b)return;const o=h().reading||{};if(x.length===0){n.innerHTML="",n.classList.add("hidden"),b.classList.remove("hidden");return}b.classList.add("hidden"),n.classList.remove("hidden"),n.innerHTML=x.map(t=>{const r=Math.round((t.progress||0)*100),a=t.subject?t.subject.name:o.noSubject||"Sin materia",m=t.note?`<p class="text-xs text-gray-400 mt-3">${t.note}</p>`:"",d=t.completed?`<span class="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-green-500/15 text-green-300">${o.completed||"Completado"}</span>`:"";return`
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
                        ${m}
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
            `}).join(""),typeof lucide<"u"&&lucide.createIcons(),z()}function z(){n&&n.addEventListener("click",async e=>{const t=e.target.closest(".delete-book-btn");if(!t)return;const r=t.dataset.bookId;!r||!await H("¿Eliminar este libro y su PDF?","Eliminar libro")||await U(Number(r))})}async function U(e){try{await A(`/books/${e}/`),await y()}catch(o){console.error("Error deleting book:",o);const r=h().reading||{};await c(r.deleteError||"No se pudo eliminar el libro.")}}async function q(e){if(e.preventDefault(),!s)return;const o=s.querySelector("button[type='submit']"),t=document.getElementById("submitBookBtnText"),a=h().reading||{},m=t?t.textContent:"";o&&(o.disabled=!0),t&&(t.textContent=a.uploading||"Subiendo...");try{const d=T();if(!d)throw new Error("User not authenticated");const v=new FormData(s),E=v.get("file");if(!E)throw new Error(a.selectPdfError||"Debes seleccionar un PDF.");const w=D(E);if(w){await c(w);return}const B=await fetch(`${P}/books/`,{method:"POST",headers:{Authorization:`Token ${d}`},body:v,credentials:"include"});if(!B.ok){let p=a.uploadError||"Error al subir el libro.";try{const l=await B.json();l&&l.file&&(p=l.file),l&&l.detail&&(p=l.detail)}catch{}await c(p);return}f(),await y()}catch(d){console.error("Error uploading book:",d),await c(a.uploadError||"No se pudo subir el libro.")}finally{o&&(o.disabled=!1),t&&(t.textContent=m||a.uploadBook||"Subir libro")}}function R(){L&&L.addEventListener("click",j),$&&$.addEventListener("click",j),M&&M.addEventListener("click",f),S&&S.addEventListener("click",f),i&&i.addEventListener("click",e=>{e.target===i&&f()}),s&&s.addEventListener("submit",q),u&&u.addEventListener("change",()=>{const e=u.files?.[0];if(!e)return;const o=D(e);o&&(c(o),u.value="")})}window.addEventListener("DOMContentLoaded",async()=>{_(),R(),await N(),await y()});
