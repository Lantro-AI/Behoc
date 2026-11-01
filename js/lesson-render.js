/* Bé Học — máy hiển thị 6 loại câu hỏi bài học (vanilla JS).
   window.BeLessonRender.render(q, mountEl) → { getAnswer() }
     q = {id, kind, question, payload:{lua_chon?,trai?,phai?}, difficulty}
     getAnswer() trả về đáp án đúng định dạng server, hoặc null nếu chưa trả lời.
   window.BeLessonRender.formatAnswer(q, dapAn) → chuỗi đáp án đúng (hiện ở màn giải thích).
   KHÔNG chứa đáp án đúng ở client (server chấm). */
(function () {
  "use strict";
  function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m])); }

  // chèn CSS 1 lần
  if (!document.getElementById("be-lesson-css")) {
    const st = document.createElement("style"); st.id = "be-lesson-css";
    st.textContent = `
      .opt.sel{border-color:var(--accent);background:var(--accent-soft);color:var(--accent-2)}
      .lr-ts{display:flex;gap:10px}.lr-ts .opt{flex:1}
      .lr-input{width:100%;box-sizing:border-box;border:2px solid var(--line);background:var(--card-2);
        color:var(--fg);font-family:inherit;font-size:17px;padding:13px 14px;border-radius:14px}
      .lr-input:focus{outline:none;border-color:var(--accent)}
      .lr-match{display:flex;gap:10px}.lr-col{flex:1;display:flex;flex-direction:column;gap:8px}
      .lr-chip{appearance:none;border:2px solid transparent;background:var(--card);color:var(--fg);
        font-family:"Baloo 2",cursive;font-weight:700;font-size:15px;padding:12px;border-radius:14px;
        cursor:pointer;box-shadow:0 3px 8px rgba(40,70,140,.1);position:relative}
      .lr-chip:active{transform:scale(.96)}
      .lr-chip.active{border-color:var(--accent)}
      .lr-chip .bdg{position:absolute;top:-8px;right:-8px;min-width:20px;height:20px;border-radius:999px;
        background:var(--accent);color:#fff;font-size:12px;display:flex;align-items:center;justify-content:center;padding:0 5px}
      .lr-order{display:flex;flex-wrap:wrap;gap:8px}
      .lr-reset{appearance:none;border:0;background:var(--card-2);color:var(--muted);font-family:inherit;
        font-weight:600;font-size:12.5px;padding:8px 12px;border-radius:999px;cursor:pointer;margin-top:10px}`;
    document.head.appendChild(st);
  }

  // ----- từng loại -----
  function trac_nghiem(q, mount, asBool){
    const opts = (q.payload && q.payload.lua_chon) || [];
    let sel = null;
    mount.innerHTML = `<div class="opts ${asBool?'lr-ts':''}">${opts.map((o,k)=>`<button class="opt" data-k="${k}">${esc(o)}</button>`).join("")}</div>`;
    mount.querySelectorAll(".opt").forEach(b=> b.onclick=()=>{ sel=+b.dataset.k;
      mount.querySelectorAll(".opt").forEach(x=>x.classList.toggle("sel", x===b)); });
    return { getAnswer: ()=> sel==null ? null : (asBool ? (sel===0) : sel) };
  }
  function dung_sai(q, mount){
    if(!q.payload || !q.payload.lua_chon) q.payload = { lua_chon:["Đúng","Sai"] };
    return trac_nghiem(q, mount, true);
  }
  function text_input(q, mount, long){
    mount.innerHTML = long
      ? `<textarea class="lr-input" rows="2" placeholder="Viết câu trả lời…"></textarea>`
      : `<input class="lr-input" type="text" placeholder="Điền đáp án…">`;
    const el = mount.querySelector(".lr-input");
    return { getAnswer: ()=>{ const v=(el.value||"").trim(); return v ? v : null; } };
  }
  function noi_cap(q, mount){
    const trai=(q.payload&&q.payload.trai)||[], phai=(q.payload&&q.payload.phai)||[];
    const map = new Array(trai.length).fill(null); let activeLeft=null;
    mount.innerHTML = `<div class="lr-match">
      <div class="lr-col" id="lrL">${trai.map((t,i)=>`<button class="lr-chip" data-i="${i}">${esc(t)}</button>`).join("")}</div>
      <div class="lr-col" id="lrR">${phai.map((p,j)=>`<button class="lr-chip" data-j="${j}">${esc(p)}</button>`).join("")}</div></div>`;
    const L=mount.querySelector("#lrL"), R=mount.querySelector("#lrR");
    function redraw(){
      L.querySelectorAll(".lr-chip").forEach(b=>{ const i=+b.dataset.i;
        b.classList.toggle("active", activeLeft===i);
        const n=map[i]; b.querySelector(".bdg")?.remove();
        if(n!=null){ const s=document.createElement("span"); s.className="bdg"; s.textContent=map.filter((x,k)=>x!=null&&k<=i).length; b.appendChild(s); } });
      R.querySelectorAll(".lr-chip").forEach(b=>{ const j=+b.dataset.j;
        b.querySelector(".bdg")?.remove(); const i=map.indexOf(j);
        if(i>=0){ const s=document.createElement("span"); s.className="bdg"; s.textContent=i+1; b.appendChild(s); } });
    }
    L.querySelectorAll(".lr-chip").forEach(b=> b.onclick=()=>{ activeLeft=+b.dataset.i; redraw(); });
    R.querySelectorAll(".lr-chip").forEach(b=> b.onclick=()=>{ if(activeLeft==null) return;
      const j=+b.dataset.j; for(let k=0;k<map.length;k++) if(map[k]===j) map[k]=null; // 1 phải chỉ nối 1 trái
      map[activeLeft]=j; activeLeft=null; redraw(); });
    return { getAnswer: ()=> map.every(x=>x!=null) ? map.slice() : null };
  }
  function sap_xep(q, mount){
    const items=(q.payload&&q.payload.lua_chon)||[]; let order=[];
    mount.innerHTML = `<div class="lr-order" id="lrO">${items.map((t,i)=>`<button class="lr-chip" data-i="${i}">${esc(t)}</button>`).join("")}</div>
      <button class="lr-reset" id="lrReset">↺ Xếp lại</button>`;
    const O=mount.querySelector("#lrO");
    function redraw(){ O.querySelectorAll(".lr-chip").forEach(b=>{ const i=+b.dataset.i; const pos=order.indexOf(i);
      b.querySelector(".bdg")?.remove(); b.classList.toggle("active", pos>=0);
      if(pos>=0){ const s=document.createElement("span"); s.className="bdg"; s.textContent=pos+1; b.appendChild(s);} }); }
    O.querySelectorAll(".lr-chip").forEach(b=> b.onclick=()=>{ const i=+b.dataset.i;
      if(order.includes(i)) return; order.push(i); redraw(); });
    mount.querySelector("#lrReset").onclick=()=>{ order=[]; redraw(); };
    return { getAnswer: ()=> order.length===items.length ? order.slice() : null };
  }

  const MAP = { trac_nghiem, dung_sai,
    dien_khuyet:(q,m)=>text_input(q,m,false), tu_luan_ngan:(q,m)=>text_input(q,m,true),
    noi_cap, sap_xep };

  function render(q, mount){ return (MAP[q.kind] || trac_nghiem)(q, mount); }

  function formatAnswer(q, dapAn){
    const p = q.payload || {};
    switch(q.kind){
      case "trac_nghiem": return String((p.lua_chon||[])[dapAn] ?? dapAn);
      case "dung_sai":    return dapAn ? "Đúng" : "Sai";
      case "noi_cap":     return (p.trai||[]).map((t,i)=>`${t} → ${(p.phai||[])[dapAn[i]]}`).join("; ");
      case "sap_xep":     return (dapAn||[]).map(ix=>(p.lua_chon||[])[ix]).join(" → ");
      default:            return String(dapAn);
    }
  }

  window.BeLessonRender = { render, formatAnswer };
})();
