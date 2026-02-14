import{t as s}from"./responsive-BEQ_P_Nu.js";let e=null,r=null;function u(){document.getElementById("confirmModal")||document.body.insertAdjacentHTML("beforeend",`
            <div id="confirmModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" style="display: none;">
                <div class="bg-dark-card border border-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl shadow-purple-900/20">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                            <i data-lucide="alert-triangle" class="w-6 h-6 text-red-400"></i>
                        </div>
                        <h3 id="confirmModalTitle" class="text-xl font-bold text-white">Confirmar acción</h3>
                    </div>
                    <p id="confirmModalMessage" class="text-gray-300 mb-6">¿Estás seguro de que deseas realizar esta acción?</p>
                    <div class="flex gap-3">
                        <button id="confirmModalCancel" class="flex-1 px-4 py-2.5 rounded-xl bg-transparent border border-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-800 transition-all" data-i18n="common.cancel">
                            Cancelar
                        </button>
                        <button id="confirmModalConfirm" class="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-bold hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all transform hover:scale-[1.02]" data-i18n="common.confirm">
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        `),e=document.getElementById("confirmModal");const n=document.getElementById("confirmModalCancel"),c=document.getElementById("confirmModalConfirm"),o=s();n&&(n.textContent=o.common.cancel,n.addEventListener("click",()=>{m(!1)})),c&&(c.textContent=o.common.confirm,c.addEventListener("click",()=>{m(!0)})),e&&e.addEventListener("click",i=>{i.target===e&&m(!1)}),typeof lucide<"u"&&lucide.createIcons()}function g(n,c="Información"){return new Promise(o=>{if(e||(u(),e=document.getElementById("confirmModal")),!e){o();return}const i=document.getElementById("confirmModalTitle"),d=document.getElementById("confirmModalMessage"),t=document.getElementById("confirmModalConfirm"),l=document.getElementById("confirmModalCancel");i&&(i.textContent=c),d&&(d.textContent=n);const a=s();t&&(t.textContent=a.common.accept,t.className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-sm font-bold hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all transform hover:scale-[1.02]"),l&&(l.style.display="none");const f=()=>{t&&t.removeEventListener("click",f),l&&(l.style.display="block",l.textContent=a.common.cancel),t&&(t.textContent=a.common.confirm,t.className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-bold hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all transform hover:scale-[1.02]"),m(!1),o()};t&&t.addEventListener("click",f,{once:!0}),e.style.display="flex",typeof lucide<"u"&&lucide.createIcons()})}function y(n,c="Confirmar acción"){return new Promise(o=>{if(e||(u(),e=document.getElementById("confirmModal")),!e){o(!1);return}const i=document.getElementById("confirmModalTitle"),d=document.getElementById("confirmModalMessage"),t=document.getElementById("confirmModalCancel"),l=document.getElementById("confirmModalConfirm");i&&(i.textContent=c),d&&(d.textContent=n);const a=s();t&&(t.textContent=a.common.cancel),l&&(l.textContent=a.common.confirm),r=o,e.style.display="flex",typeof lucide<"u"&&lucide.createIcons()})}function m(n){e&&(e.style.display="none"),r&&(r(n),r=null)}export{g as a,u as i,y as s};
