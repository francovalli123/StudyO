import"./modulepreload-polyfill-B5Qt9EMX.js";import{a as j,i as $,c as I,f as D,B as C,j as F}from"./auth-gate-BmIZwCWq.js";import{i as T,s as l,a as P}from"./confirmModal-CsuM_zu4.js";import"./responsive-XJpnnCaS.js";document.addEventListener("DOMContentLoaded",function(){const e=document.getElementById("logoutBtn");e&&e.addEventListener("click",async t=>{t.preventDefault();try{await j(),window.location.href="/"}catch(o){console.error("Error al cerrar sesión:",o),window.location.href="/"}})});$({loginPath:"/login"});const A=50*1024*1024;let w=[],b=[];const B=document.getElementById("addBookBtn"),k=document.getElementById("emptyStateAddBtn"),a=document.getElementById("bookModal"),E=document.getElementById("closeBookModalBtn"),L=document.getElementById("cancelBookBtn"),i=document.getElementById("bookForm"),n=document.getElementById("booksGrid"),m=document.getElementById("emptyState"),p=document.getElementById("bookSubject"),c=document.getElementById("bookFile");function M(){!a||!i||(i.reset(),a.classList.add("active"))}function u(){a&&a.classList.remove("active")}function S(e){return e.name.toLowerCase().endsWith(".pdf")?e.type!=="application/pdf"?"El archivo debe ser un PDF válido.":e.size>A?"El archivo supera el límite de 50MB.":null:"Solo se permiten archivos PDF."}async function _(){try{if(w=await I("/subjects/"),!p)return;p.innerHTML='<option value="">Selecciona una materia</option>',w.forEach(e=>{const t=document.createElement("option");t.value=String(e.id),t.textContent=e.name,p.appendChild(t)})}catch(e){console.error("Error loading subjects:",e)}}async function g(){try{b=await I("/books/"),H()}catch(e){console.error("Error loading books:",e),n&&(n.innerHTML='<p class="text-red-400 col-span-full">Error loading books</p>')}}function H(){if(!(!n||!m)){if(b.length===0){n.innerHTML="",n.classList.add("hidden"),m.classList.remove("hidden");return}m.classList.add("hidden"),n.classList.remove("hidden"),n.innerHTML=b.map(e=>{const t=Math.round((e.progress||0)*100),o=e.subject?e.subject.name:"Sin materia",s=e.note?`<p class="text-xs text-gray-400 mt-3">${e.note}</p>`:"",r=e.completed?'<span class="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-green-500/15 text-green-300">Completed</span>':"";return`
                <div class="bg-dark-card rounded-2xl p-6 relative group" style="box-shadow: 0 0 0 1px rgba(168,85,247,0.2), 0 0 30px rgba(168,85,247,0.15), inset 0 0 20px rgba(168,85,247,0.03);">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-start gap-3">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 via-fuchsia-500/30 to-purple-500/30 flex items-center justify-center flex-shrink-0" style="box-shadow: 0 0 0 1px rgba(168,85,247,0.3);">
                                <i data-lucide="book" class="w-5 h-5 text-purple-400"></i>
                            </div>
                            <div class="flex-1">
                                <h3 class="text-xl font-bold text-white">${e.title}</h3>
                                <p class="text-sm text-gray-400 mt-1">${e.author}</p>
                                <p class="text-xs text-gray-500 mt-1">${o}</p>
                            </div>
                        </div>
                        ${r}
                    </div>

                    <div class="mb-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs text-gray-400">Progreso</span>
                            <span class="text-sm font-bold text-purple-400">${t}%</span>
                        </div>
                        <div class="text-xs text-gray-400 mb-2">${e.last_page_read} / ${e.total_pages} páginas</div>
                        <div class="w-full h-2 rounded-full bg-gray-700/50" style="box-shadow: inset 0 0 10px rgba(0,0,0,0.3);">
                            <div class="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300" style="width: ${t}%; box-shadow: 0 0 15px rgba(168,85,247,0.6);"></div>
                        </div>
                        ${s}
                    </div>

                    <div class="flex gap-3 pt-4 border-t border-gray-700/50">
                        <a href="/reading/viewer/${e.id}" class="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-gray-700 text-gray-300 hover:text-white text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2">
                            <i data-lucide="book-open" class="w-4 h-4"></i>
                            <span>Open Book</span>
                        </a>
                        <button class="delete-book-btn flex-1 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2" data-book-id="${e.id}">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                            <span>Delete</span>
                        </button>
                    </div>
                </div>
            `}).join(""),typeof lucide<"u"&&lucide.createIcons(),G()}}function G(){n&&n.addEventListener("click",async e=>{const o=e.target.closest(".delete-book-btn");if(!o)return;const s=o.dataset.bookId;!s||!await P("¿Eliminar este libro y su PDF?","Eliminar libro")||await N(Number(s))})}async function N(e){try{await F(`/books/${e}/`),await g()}catch(t){console.error("Error deleting book:",t),await l("No se pudo eliminar el libro.")}}async function O(e){if(e.preventDefault(),!i)return;const t=i.querySelector("button[type='submit']"),o=document.getElementById("submitBookBtnText"),s=o?o.textContent:"";t&&(t.disabled=!0),o&&(o.textContent="Subiendo...");try{const r=D();if(!r)throw new Error("User not authenticated");const x=new FormData(i),h=x.get("file");if(!h)throw new Error("Debes seleccionar un PDF.");const y=S(h);if(y){await l(y);return}const v=await fetch(`${C}/books/`,{method:"POST",headers:{Authorization:`Token ${r}`},body:x,credentials:"include"});if(!v.ok){let f="Error al subir el libro.";try{const d=await v.json();d&&d.file&&(f=d.file),d&&d.detail&&(f=d.detail)}catch{}await l(f);return}u(),await g()}catch(r){console.error("Error uploading book:",r),await l("No se pudo subir el libro.")}finally{t&&(t.disabled=!1),o&&(o.textContent=s||"Upload Book")}}function U(){B&&B.addEventListener("click",M),k&&k.addEventListener("click",M),E&&E.addEventListener("click",u),L&&L.addEventListener("click",u),a&&a.addEventListener("click",e=>{e.target===a&&u()}),i&&i.addEventListener("submit",O),c&&c.addEventListener("change",()=>{const e=c.files?.[0];if(!e)return;const t=S(e);t&&(l(t),c.value="")})}window.addEventListener("DOMContentLoaded",async()=>{T(),U(),await _(),await g()});
