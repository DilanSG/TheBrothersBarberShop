import{u as de,s as Y,a as ae,b as me,c as pe,j as e,P as ue,D as xe,G as ce}from"./index-xDHdJVsL.js";import{r as w}from"./vendor-CqFXMR30.js";import{T as ge,z as he,x as be,a as fe,G as se,v as ye,F as ve,H as we,X as Ne,I as je,J as De}from"./utils-DFsqPVhN.js";const g=(F,...A)=>{console.log(F,...A)},Se=()=>{const{showError:F,showSuccess:A}=de(),[S,O]=w.useState([]),[P,K]=w.useState({}),[V,I]=w.useState({}),[B,$]=w.useState(!0),[_,k]=w.useState(""),[G,L]=w.useState([]),[Q,X]=w.useState({}),[l,h]=w.useState("General"),[u,T]=w.useState(""),[j,f]=w.useState(!1),[E,z]=w.useState(null),[Z,H]=w.useState(!1),[ee,q]=w.useState(null),U=w.useMemo(()=>G.sort((a,s)=>new Date(s)-new Date(a)),[G]);w.useEffect(()=>{(async()=>{try{const s=await Y.getAvailableDates(),n=(s==null?void 0:s.data)||[];let m=[];const p=[...new Set([...n,...m])].filter(t=>t&&t.trim()!=="").sort((t,o)=>new Date(o)-new Date(t));g("📅 Fechas disponibles cargadas:",p),L(p)}catch(s){console.error("Error cargando fechas globales:",s),L([])}})()},[]),w.useEffect(()=>{if(g("🔄 Aplicando filtro:",l,u,"Barbers:",S.length),l==="General"||!u){g("📋 Usando estadísticas generales - limpiando filtros"),I({}),f(!1);return}if(S.length===0){g("⚠️ No hay barberos para filtrar");return}if(j){g("⏳ Filtrado ya en progreso, saltando...");return}g("🎯 Ejecutando filtrado por tipo:",l,"fecha base:",u),le()},[l,u,S]);const re=()=>{if(!u||l==="General")return[];const a=new Date(u+"T12:00:00"),s=[];if(l==="Día")s.push(new Date(a));else if(l==="Semana")for(let n=0;n<7;n++){const m=new Date(a);m.setDate(a.getDate()-n),s.push(new Date(m))}else if(l==="Mes")for(let n=0;n<30;n++){const m=new Date(a);m.setDate(a.getDate()-n),s.push(new Date(m))}return g("🎯 Rango a resaltar:",l,u,s.map(n=>{const m=n.getFullYear(),p=(n.getMonth()+1).toString().padStart(2,"0"),t=n.getDate().toString().padStart(2,"0");return`${m}-${p}-${t}`})),s},oe=async()=>{if(!u||l==="General")return U;const a=new Date(u+"T12:00:00"),s=l==="Semana"?7:l==="Mes"?30:1,n=U.filter(m=>{const p=new Date(m+"T12:00:00"),t=Math.floor((a-p)/(1e3*60*60*24));return t>=0&&t<s});return g("📅 Fechas válidas para rango:",l,u,n),n},te=(a,s)=>{if(!s)return[];const n=new Date(s+"T00:00:00.000Z"),m=[];if(a==="Día")m.push(n.toISOString().split("T")[0]);else if(a==="Semana")for(let t=0;t<7;t++){const o=new Date(n);o.setDate(n.getDate()-t),m.push(o.toISOString().split("T")[0])}else if(a==="Mes")for(let t=0;t<30;t++){const o=new Date(n);o.setDate(n.getDate()-t),m.push(o.toISOString().split("T")[0])}const p=m.filter(t=>U.includes(t));return g(`📅 Rango para ${a} desde ${s}:`,`Total generado: ${m.length}, Con datos: ${p.length}`,p),p},le=async()=>{if(!u||l==="General"){I({}),f(!1);return}f(!0),console.log(`🔍 INICIANDO FILTRO: ${l} - ${u}`),l==="Día"?await W(u):await ne(),console.log(`✅ FILTRO COMPLETADO: ${l} - ${u}`)},W=async a=>{var n,m,p,t;console.log("📅 FILTRO DIARIO ALTERNATIVO - Filtrando desde datos existentes:",a),f(!0);const s={};for(const o of S)try{console.log(`📊 Procesando día ${a} para barbero ${((n=o.user)==null?void 0:n.name)||o._id}...`),s[o._id]={sales:{total:0,count:0},cortes:{count:0,total:0},appointments:{completed:0,total:0}};try{const[c,d]=await Promise.all([Y.getDailyReport(a,o._id),ae.getDailyReport(a,o._id)]);if(console.log(`� Datos del día para ${(m=o.user)==null?void 0:m.name}:`,{ventas:c,citas:d}),c!=null&&c.success&&(c!=null&&c.data)){let x=0,y=0,D=0,v=0;Array.isArray(c.data)?c.data.forEach(b=>{b.type==="product"?(x+=b.total||0,y+=1):(b.type==="walkIn"||b.type==="corte")&&(D+=b.total||0,v+=1)}):c.data.total!==void 0&&(x=c.data.total||0,y=c.data.count||0),s[o._id].sales={total:x,count:y},s[o._id].cortes={count:v,total:D},console.log(`💰 Ventas del día ${a}:`,{totalVentas:x,countVentas:y,totalCortes:D,countCortes:v})}if(d!=null&&d.success&&(d!=null&&d.data)){let x=0,y=0;Array.isArray(d.data)?d.data.forEach(D=>{var v;x+=D.total||((v=D.service)==null?void 0:v.price)||0,D.status==="completed"&&(y+=1)}):d.data.total!==void 0&&(x=d.data.total||0,y=d.data.completed||0),s[o._id].appointments={completed:y,total:x},console.log(`📅 Citas del día ${a}:`,{totalCitas:x,countCitas:y})}}catch(c){console.warn(`⚠️ Error obteniendo datos del día ${a} para ${(p=o.user)==null?void 0:p.name}:`,c.message)}console.log(`✅ FINAL día ${a} para ${(t=o.user)==null?void 0:t.name}:`,s[o._id])}catch(c){console.error(`❌ Error processing day ${a} for barber ${o._id}:`,c)}console.log("📊 RESULTADO FINAL - Estadísticas del día:",s),I(s),f(!1)},ne=async()=>{var n,m,p;if(!S||S.length===0)return;f(!0);const a=te(l,u);if(g(`📅 Procesando ${l} - Fechas válidas:`,a),a.length===0){g("❌ No hay fechas válidas para el rango, mostrando estadísticas vacías");const t={};S.forEach(o=>{t[o._id]={sales:{total:0,count:0},cortes:{count:0,total:0},appointments:{completed:0,total:0}}}),I(t),f(!1);return}const s={};for(const t of S)try{g(`📊 Procesando ${l} para barbero ${((n=t.user)==null?void 0:n.name)||t._id}...`);let o=0,c=0,d=0,x=0,y=0,D=0;for(const v of a)try{g(`📅 Procesando fecha ${v} para ${(m=t.user)==null?void 0:m.name}...`);const[b,N]=await Promise.all([Y.getBarberSalesStats(t._id,{date:v}),ae.getBarberAppointmentStats(t._id,{date:v})]);if(b!=null&&b.success&&(b!=null&&b.data)){const i=b.data;i.ventas&&Array.isArray(i.ventas)&&i.ventas.forEach(M=>{o+=M.total||0,c+=1}),i.cortes&&Array.isArray(i.cortes)&&i.cortes.forEach(M=>{d+=M.total||0,x+=1}),i.total!==void 0&&!i.ventas&&(o+=i.total),i.cortesTotal!==void 0&&!i.cortes&&(d+=i.cortesTotal),g(`💰 ${v} - Ventas: ${i.total||0}, Cortes: ${i.cortesTotal||0}`)}if(N!=null&&N.success&&(N!=null&&N.data)){const i=N.data;i.citas&&Array.isArray(i.citas)&&i.citas.forEach(M=>{var ie;y+=M.revenue||((ie=M.service)==null?void 0:ie.price)||0,M.status==="completed"&&(D+=1)}),i.revenue!==void 0&&!i.citas&&(y+=i.revenue),i.completed!==void 0&&!i.citas&&(D+=i.completed),g(`📅 ${v} - Citas: ${i.revenue||0}, Completadas: ${i.completed||0}`)}}catch(b){g(`⚠️ Error procesando fecha ${v} para barbero ${t._id}:`,b.message)}s[t._id]={sales:{total:o,count:c},cortes:{count:x,total:d},appointments:{completed:D,total:y}},g(`✅ TOTAL ${l} para ${(p=t.user)==null?void 0:p.name}:`,`Ventas: ${o}, Cortes: ${d}, Citas: ${y}`,`Fechas procesadas: ${a.length}`)}catch(o){console.error(`❌ Error procesando ${l} para barbero ${t._id}:`,o),s[t._id]={sales:{total:0,count:0},cortes:{count:0,total:0},appointments:{completed:0,total:0}}}g(`📊 FINAL - Estadísticas filtradas por ${l}:`,s),I(s),f(!1)},J=async()=>{$(!0),k("");try{const a=await me.getAllBarbers();let s=[];Array.isArray(a)?s=a:a&&a.data&&Array.isArray(a.data)?s=a.data:a&&Array.isArray(a.success)&&(s=a.success),O(s),await r(s)}catch(a){console.error("Error al cargar barberos:",a),O([]),k("Error al cargar los datos")}finally{$(!1)}},r=async a=>{var n,m;g("📊 Cargando estadísticas para",a.length,"barberos...");const s={};for(let p=0;p<a.length;p++){const t=a[p];try{g(`🔄 Cargando stats para barbero ${p+1}/${a.length}: ${((n=t.user)==null?void 0:n.name)||t._id}`),p>0&&await new Promise(N=>setTimeout(N,150*p));const[o,c]=await Promise.all([Y.getBarberSalesStats(t._id),ae.getBarberAppointmentStats(t._id)]);let d=0,x=0;o.data&&Array.isArray(o.data.ventas)?o.data.ventas.forEach(N=>{d+=N.total||0,x+=1}):o.data&&typeof o.data.total=="number"&&(d=o.data.total,x=o.data.count||0);let y=0,D=0;o.data&&Array.isArray(o.data.cortes)&&o.data.cortes.forEach(N=>{D+=N.total||0,y+=1});let v=0,b=0;c.data&&Array.isArray(c.data.citas)?c.data.citas.forEach(N=>{var i;v+=N.revenue||((i=N.service)==null?void 0:i.price)||0,b+=1}):c.data&&typeof c.data.revenue=="number"&&(v=c.data.revenue,b=c.data.completed||0),s[t._id]={sales:{total:d,count:x},cortes:{count:y,total:D},appointments:{completed:b,total:v}},g(`✅ Stats cargadas para ${((m=t.user)==null?void 0:m.name)||t._id}:`,s[t._id])}catch(o){console.error(`❌ Error loading stats for barber ${t._id}:`,o),s[t._id]={sales:{total:0,count:0},cortes:{count:0,total:0},appointments:{completed:0,total:0}}}}g("📈 Todas las estadísticas cargadas:",s),K(s)},C=async a=>{try{const[s,n]=await Promise.all([Y.getAvailableDates(a),ae.getAvailableDates(a)]),m=[...new Set([...(s==null?void 0:s.data)||[],...(n==null?void 0:n.data)||[]])].sort((p,t)=>new Date(t)-new Date(p));X(p=>({...p,[a]:m}))}catch(s){console.error("Error cargando fechas disponibles:",s),F("Error al cargar fechas disponibles")}},R=async(a,s=null)=>{H(!0),q(a);try{const n=s||new Date().toISOString().split("T")[0],m=await Y.getDailyReport(n,a);g("🔍 Respuesta del servidor:",m);const p=S.find(o=>o._id===a),t=(m==null?void 0:m.data)||m;return g("📊 Datos procesados:",t),z({date:n,barber:p,sales:(t==null?void 0:t.sales)||[],appointments:(t==null?void 0:t.appointments)||[],walkIns:(t==null?void 0:t.walkIns)||[],totals:(t==null?void 0:t.totals)||{}}),A("Reporte generado exitosamente"),!0}catch(n){return console.error("Error generando reporte:",n),F("Error al generar el reporte"),!1}finally{H(!1),q(null)}};return w.useEffect(()=>{J()},[]),{barbers:S,statistics:P,filteredStats:V,loading:B,error:_,globalAvailableDates:G,allAvailableDates:U,availableDates:Q,filterType:l,filterDate:u,filterLoading:j,reportData:E,loadingReport:Z,selectedBarber:ee,setFilterType:h,setFilterDate:T,getHighlightedRange:re,getValidDatesForRange:oe,getDateRange:te,loadData:J,loadStatistics:r,loadBarberAvailableDates:C,generateBarberReport:R,setReportData:z}},$e=()=>{const[F,A]=w.useState(!1),[S,O]=w.useState({}),[P,K]=w.useState(()=>new Date),V=async(l,h)=>{S[l]?O(u=>({...u,[l]:!1})):(O(u=>({...u,[l]:!0})),h&&await h(l))},I=l=>{O(h=>({...h,[l]:!1}))},B=()=>{O({})},$=()=>{A(!0)};return{showReportModal:F,barberMenus:S,calendarMonth:P,setShowReportModal:A,setBarberMenus:O,setCalendarMonth:K,toggleBarberMenu:V,closeBarberMenu:I,closeAllMenus:B,openReportModal:$,closeReportModal:()=>{A(!1)},handleGenerateReport:async(l,h,u,T)=>{await u(l,h)&&($(),T&&T(l))},generateQuickReport:async(l,h,u,T,j)=>{var z;const f=new Date;f.setDate(f.getDate()-h);const E=f.toISOString().split("T")[0];(z=u[l])!=null&&z.includes(E)?await T(l,E):j(`No hay datos para ${h===1?"ayer":"anteayer"}`)},handleManualDateSelect:async(l,h,u,T,j)=>{var f;return(f=u[h])!=null&&f.includes(l)?(await T(h,l),!0):(l&&j("No hay datos disponibles para la fecha seleccionada"),!1)},isDateDisabled:(l,h)=>{const u=l.getFullYear(),T=(l.getMonth()+1).toString().padStart(2,"0"),j=l.getDate().toString().padStart(2,"0"),f=`${u}-${T}-${j}`;return!h.includes(f)},handleDateSelect:(l,h,u)=>{if(!l)return;const T=l.getFullYear(),j=(l.getMonth()+1).toString().padStart(2,"0"),f=l.getDate().toString().padStart(2,"0"),E=`${T}-${j}-${f}`;console.log("📅 Día seleccionado:",E,"Disponible:",h.includes(E)),h.includes(E)?u(E):console.warn("⚠️ Día no disponible seleccionado:",E)}}},Ae=`
  .compact-calendar {
    font-size: 11px;
    color: #e5e7eb;
  }
  
  .compact-calendar .rdp-months {
    width: 100%;
    max-width: 280px;
  }
  
  .compact-calendar .rdp-day {
    color: #9ca3af;
    width: 28px;
    height: 28px;
    font-size: 11px;
  }
  
  .compact-calendar .rdp-day_button {
    width: 28px !important;
    height: 28px !important;
    border-radius: 50% !important;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    border: 1px solid transparent !important;
  }
  
  .compact-calendar .rdp-day_button:hover {
    background-color: rgba(59, 130, 246, 0.3) !important;
    border-radius: 50% !important;
  }
  
  .compact-calendar .available-day .rdp-day_button {
    background-color: rgba(34, 197, 94, 0.25) !important;
    color: #86efac !important;
    border: 1px solid rgba(34, 197, 94, 0.4) !important;
    border-radius: 50% !important;
  }
  
  .compact-calendar .rdp-day_selected .rdp-day_button,
  .compact-calendar .selected-day .rdp-day_button {
    background-color: #2563eb !important;
    color: white !important;
    font-weight: bold !important;
    border: 2px solid #60a5fa !important;
    border-radius: 50% !important;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3) !important;
  }
  
  .compact-calendar .highlight-day .rdp-day_button {
    background-color: #1d4ed8 !important;
    color: white !important;
    font-weight: bold !important;
    border: 2px solid #93c5fd !important;
    border-radius: 50% !important;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.4) !important;
  }
  
  .compact-calendar .rdp-caption {
    color: #e5e7eb;
    font-size: 12px;
    font-weight: 600;
  }
  
  .compact-calendar .rdp-nav {
    color: #e5e7eb;
  }
  
  .compact-calendar .rdp-head_cell {
    color: #9ca3af;
    font-size: 10px;
    font-weight: 500;
  }
  
  /* Asegurar que los estilos de selección tengan prioridad */
  .compact-calendar .rdp-day_selected {
    background-color: #2563eb !important;
    border-radius: 50% !important;
  }
  
  .compact-calendar .rdp-day_selected .rdp-day_button {
    background-color: #2563eb !important;
    color: white !important;
  }
`;if(typeof document!="undefined"){const F="compact-calendar-styles";if(!document.getElementById(F)){const A=document.createElement("style");A.id=F,A.textContent=Ae,document.head.appendChild(A)}}const Ee=()=>{const{user:F}=pe(),{showError:A}=de(),{barbers:S,statistics:O,filteredStats:P,loading:K,error:V,globalAvailableDates:I,allAvailableDates:B,availableDates:$,filterType:_,filterDate:k,filterLoading:G,reportData:L,loadingReport:Q,selectedBarber:X,setFilterType:l,setFilterDate:h,getHighlightedRange:u,loadBarberAvailableDates:T,generateBarberReport:j}=Se(),{showReportModal:f,barberMenus:E,calendarMonth:z,setCalendarMonth:Z,toggleBarberMenu:H,closeReportModal:ee,handleGenerateReport:q,generateQuickReport:U,handleManualDateSelect:re,isDateDisabled:oe,handleDateSelect:te}=$e(),le=r=>{var C;return((C=r.user)==null?void 0:C.role)==="admin"?e.jsx(je,{className:"h-6 w-6 text-yellow-400"}):e.jsx(De,{className:"h-6 w-6 text-blue-400"})},W=r=>new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",minimumFractionDigits:0,maximumFractionDigits:0}).format(r||0),ne=()=>{if(!L)return;const r=J(L),C=new Blob([r],{type:"text/html"}),R=URL.createObjectURL(C),a=document.createElement("a");a.href=R,a.download=`reporte-${L.date}.html`,document.body.appendChild(a),a.click(),document.body.removeChild(a),URL.revokeObjectURL(R)},J=r=>{if(!r)return"<p>No hay datos disponibles para el reporte</p>";const C=Array.isArray(r.sales)?r.sales:[],R=Array.isArray(r.appointments)?r.appointments:[],a=Array.isArray(r.walkIns)?r.walkIns:[],s=t=>new Date(t).toLocaleDateString("es-ES",{year:"numeric",month:"long",day:"numeric"}),n=t=>new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",minimumFractionDigits:0,maximumFractionDigits:0}).format(t),p=(()=>{const t=C.reduce((d,x)=>d+(x.total||0),0),o=R.reduce((d,x)=>d+(x.total||0),0),c=a.reduce((d,x)=>d+(x.total||0),0);return{productTotal:t,appointmentTotal:o,walkInTotal:c,grandTotal:t+o+c}})();return`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte Diario - ${s(r.date)}</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            background-color: white;
            color: black;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            line-height: 1.4;
        }
        .header {
            text-align: center;
            border-block-end: 2px solid #000;
            padding-block-end: 10px;
            margin-block-end: 20px;
        }
        .shop-name {
            font-size: 18px;
            font-weight: bold;
            margin-block-end: 5px;
        }
        .report-title {
            font-size: 14px;
            margin-block-end: 5px;
        }
        .date {
            font-size: 12px;
        }
        .section {
            margin-block-end: 25px;
        }
        .section-title {
            font-size: 14px;
            font-weight: bold;
            border-block-end: 1px solid #000;
            padding-block-end: 5px;
            margin-block-end: 10px;
        }
        .item {
            display: flex;
            justify-content: space-between;
            padding: 2px 0;
            border-block-end: 1px dotted #ccc;
        }
        .item-name {
            flex: 1;
            padding-inline-end: 10px;
        }
        .item-price {
            font-weight: bold;
        }
        .subtotal {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-block-start: 1px solid #000;
            font-weight: bold;
        }
        .total {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-block-start: 2px solid #000;
            font-weight: bold;
            font-size: 14px;
        }
        .footer {
            text-align: center;
            margin-block-start: 30px;
            padding-block-start: 10px;
            border-block-start: 1px solid #000;
            font-size: 10px;
        }
        @media print {
            body { margin: 0; padding: 10px; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="shop-name">THE BROTHERS BARBER SHOP</div>
        <div class="report-title">REPORTE DIARIO</div>
        <div class="date">${s(r.date)}</div>
    </div>

    <!-- PRODUCTOS VENDIDOS -->
    <div class="section">
        <div class="section-title">PRODUCTOS VENDIDOS</div>
        ${C.length===0?"<div>No hay ventas registradas</div>":""}
        ${C.map(t=>{var o;return`
            <div class="item">
                <div class="item-name">${((o=t.products)==null?void 0:o.map(c=>{var d;return`${((d=c.product)==null?void 0:d.name)||"Producto"} x${c.quantity}`}).join(", "))||"Venta"}</div>
                <div class="item-price">${n(t.total)}</div>
            </div>
        `}).join("")}
        ${C.length>0?`
            <div class="subtotal">
                <div>SUBTOTAL PRODUCTOS:</div>
                <div>${n(p.productTotal)}</div>
            </div>
        `:""}
    </div>

    <!-- CORTES SIN CITA -->
    <div class="section">
        <div class="section-title">CORTES SIN CITA (WALK-INS)</div>
        ${a.length===0?"<div>No hay cortes sin cita registrados</div>":""}
        ${a.map(t=>{var o,c,d;return`
            <div class="item">
                <div class="item-name">${((o=t.service)==null?void 0:o.name)||"Servicio"} - ${((d=(c=t.barber)==null?void 0:c.user)==null?void 0:d.name)||"Barbero"}</div>
                <div class="item-price">${n(t.total)}</div>
            </div>
        `}).join("")}
        ${a.length>0?`
            <div class="subtotal">
                <div>SUBTOTAL WALK-INS:</div>
                <div>${n(p.walkInTotal)}</div>
            </div>
        `:""}
    </div>

    <!-- CITAS COMPLETADAS -->
    <div class="section">
        <div class="section-title">CITAS COMPLETADAS</div>
        ${R.length===0?"<div>No hay citas completadas</div>":""}
        ${R.map(t=>{var o,c,d,x;return`
            <div class="item">
                <div class="item-name">${((o=t.service)==null?void 0:o.name)||"Servicio"} - ${((d=(c=t.barber)==null?void 0:c.user)==null?void 0:d.name)||"Barbero"} - ${((x=t.user)==null?void 0:x.name)||"Cliente"}</div>
                <div class="item-price">${n(t.total||0)}</div>
            </div>
        `}).join("")}
        ${R.length>0?`
            <div class="subtotal">
                <div>SUBTOTAL CITAS:</div>
                <div>${n(p.appointmentTotal)}</div>
            </div>
        `:""}
    </div>

    <div class="total">
        <div>TOTAL GENERAL:</div>
        <div>${n(p.grandTotal)}</div>
    </div>

    <div class="footer">
        Reporte generado el ${new Date().toLocaleString("es-ES")}
    </div>
</body>
</html>
    `.trim()};return e.jsxs(ue,{children:[e.jsxs("div",{className:"min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white relative overflow-hidden",children:[e.jsx("div",{className:"absolute inset-0 bg-gradient-to-r from-blue-900/8 via-purple-900/8 to-blue-900/8"}),e.jsx("div",{className:"absolute inset-0 opacity-40",style:{backgroundImage:"radial-gradient(circle, rgba(59, 130, 246, 0.3) 1px, transparent 1px)",backgroundSize:"30px 30px",backgroundPosition:"0 0, 15px 15px"}}),e.jsx("div",{className:"absolute inset-0 opacity-20",style:{backgroundImage:"radial-gradient(circle, rgba(168, 85, 247, 0.4) 1px, transparent 1px)",backgroundSize:"20px 20px",backgroundPosition:"10px 10px"}}),e.jsx("div",{className:"absolute inset-0 opacity-15",style:{backgroundImage:"radial-gradient(circle, rgba(59, 130, 246, 0.5) 0.8px, transparent 0.8px)",backgroundSize:"40px 40px",backgroundPosition:"20px 0"}}),e.jsxs("div",{className:"relative z-10 container mx-auto px-4 py-8",children:[e.jsxs("div",{className:"mb-8 flex flex-col items-center gap-2",children:[e.jsx("div",{className:"flex gap-2 bg-white/5 rounded-lg p-1 border border-white/10",children:["General","Día","Semana","Mes"].map(r=>e.jsx("button",{className:`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${_===r?"bg-blue-500/80 text-white":"text-blue-200 hover:bg-blue-500/30"}`,onClick:()=>{l(r),r==="General"&&h("")},children:r},r))}),e.jsxs("div",{className:"text-xs text-center",children:[I.length>0?e.jsxs("div",{className:"text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20",children:["✅ ",I.length," días con datos disponibles"]}):e.jsx("div",{className:"text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20",children:"⏳ Cargando fechas con datos..."}),_!=="General"&&k&&e.jsxs("div",{className:"mt-2 text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20",children:["🔍 Filtro activo: ",_," - ",k,G&&e.jsx("span",{className:"ml-2 animate-pulse",children:"⏳"})]}),_!=="General"&&!k&&e.jsxs("div",{className:"mt-2 text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20",children:["⚠️ Selecciona una fecha para aplicar el filtro ",_]})]}),_!=="General"&&e.jsxs("div",{className:"flex flex-col items-center gap-2 mt-2",children:[e.jsx("span",{className:"text-xs text-gray-300",children:"Selecciona fecha base:"}),e.jsxs("div",{className:"bg-gray-900/80 rounded-lg p-3 border border-gray-700/40 max-w-xs",children:[e.jsx(xe,{mode:"single",selected:k?new Date(k+"T12:00:00"):void 0,onSelect:r=>te(r,B,h),month:z,onMonthChange:Z,disabled:r=>oe(r,B),modifiers:{highlight:u(),available:B.map(r=>new Date(r+"T12:00:00")),selected:k?[new Date(k+"T12:00:00")]:[]},modifiersClassNames:{highlight:"highlight-day",available:"available-day",selected:"selected-day"},showOutsideDays:!1,className:"compact-calendar"}),e.jsxs("div",{className:"text-xs text-gray-600 bg-gray-800/30 rounded px-2 py-1 mt-2",children:["💡 Solo los días con datos están habilitados (verde). El rango ",_.toLowerCase()," se resalta en azul.",B.length>0&&e.jsxs("div",{className:"mt-1 text-green-400",children:["📊 ",B.length," días con datos disponibles"]})]})]})]})]}),V&&e.jsx("div",{className:"mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 backdrop-blur-sm shadow-2xl shadow-red-500/20",children:e.jsxs("div",{className:"flex items-center",children:[e.jsx(ge,{className:"h-5 w-5 mr-2"}),V]})}),e.jsx("div",{className:"bg-transparent border border-white/10 rounded-2xl backdrop-blur-sm shadow-2xl shadow-blue-500/20",children:K?e.jsxs("div",{className:"p-8 text-center",children:[e.jsx("div",{className:"inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"}),e.jsx("p",{className:"mt-2 text-gray-400 text-sm",children:"Cargando estadísticas..."})]}):S.length===0?e.jsxs("div",{className:"p-8 text-center",children:[e.jsx(he,{className:"w-12 h-12 text-gray-600 mx-auto mb-3"}),e.jsx("p",{className:"text-gray-400 text-sm",children:"No hay barberos registrados"})]}):e.jsx("div",{className:"divide-y divide-white/10",children:S.map(r=>{var n,m,p,t,o,c,d,x,y,D,v,b,N;const C=_!=="General"&&k,R=Object.keys(P).length>0,a=C&&R&&P[r._id],s=a?P[r._id]:O[r._id]||{};return console.log(`� DEBUG ${(n=r.user)==null?void 0:n.name}:`,{filterType:_,filterDate:k,hasFilterDate:C,hasFilteredData:R,useFiltered:a,filteredStatsKeys:Object.keys(P),barberFilteredStats:P[r._id],barberGeneralStats:O[r._id],finalStats:s}),e.jsxs("div",{className:"px-4 py-6 hover:bg-white/5 transition-colors backdrop-blur-sm",children:[e.jsxs("div",{className:"flex flex-col lg:flex-row gap-6 items-start",children:[e.jsxs("div",{className:"flex items-start gap-4 flex-1",children:[e.jsx("div",{className:"w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0",children:le(r)}),e.jsxs("div",{className:"flex-1",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[e.jsx("h4",{className:"text-xl font-semibold",children:e.jsx(ce,{className:"text-xl font-semibold",children:((m=r.user)==null?void 0:m.name)||"Sin nombre"})}),e.jsx("span",{className:`text-xs px-2 py-1 rounded-full ${r.isActive?"text-green-400":"text-red-400"} bg-current/10`,children:r.isActive?"Activo":"Inactivo"})]}),e.jsx("p",{className:"text-sm text-gray-400 mb-1",children:r.specialty}),e.jsxs("p",{className:"text-sm text-blue-400",children:[r.experience," años de experiencia"]})]})]}),e.jsxs("div",{className:"grid grid-cols-2 lg:grid-cols-4 gap-2 w-full lg:w-auto",children:[G?e.jsx("div",{className:"col-span-4 text-center py-4 text-xs text-blue-300",children:"Cargando datos del rango seleccionado..."}):null,e.jsxs("div",{className:"bg-white/5 rounded-lg p-2 text-center border border-white/10",children:[e.jsx(be,{className:"w-5 h-5 text-green-400 mx-auto mb-1"}),e.jsx("div",{className:"text-base font-bold text-green-400",children:W(((p=s.sales)==null?void 0:p.total)||0)}),e.jsxs("div",{className:"text-[11px] text-gray-400",children:[((t=s.sales)==null?void 0:t.count)||0," ventas"]})]}),e.jsxs("div",{className:"bg-white/5 rounded-lg p-2 text-center border border-white/10",children:[e.jsx(fe,{className:"w-5 h-5 text-purple-400 mx-auto mb-1"}),e.jsx("div",{className:"text-base font-bold text-purple-400",children:((o=s.cortes)==null?void 0:o.count)||0}),e.jsx("div",{className:"text-[11px] text-gray-400",children:"cortes"})]}),e.jsxs("div",{className:"bg-white/5 rounded-lg p-2 text-center border border-white/10",children:[e.jsx(se,{className:"w-5 h-5 text-blue-400 mx-auto mb-1"}),e.jsx("div",{className:"text-base font-bold text-blue-400",children:W(((c=s.appointments)==null?void 0:c.total)||0)}),e.jsxs("div",{className:"text-[10px] text-gray-500",children:[((d=s.appointments)==null?void 0:d.completed)||0," citas"]})]}),e.jsxs("div",{className:"bg-white/5 rounded-lg p-2 text-center border border-white/10",children:[e.jsx(ye,{className:"w-5 h-5 text-yellow-400 mx-auto mb-1"}),e.jsx("div",{className:"text-base font-bold text-yellow-400",children:W((((x=s.sales)==null?void 0:x.total)||0)+(((y=s.appointments)==null?void 0:y.total)||0))}),e.jsx("div",{className:"text-[11px] text-gray-400",children:"ingresos totales"})]})]}),e.jsx("div",{className:"relative",children:e.jsx("button",{onClick:()=>H(r._id,T),className:"p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors flex items-center justify-center",disabled:Q,children:Q&&X===r._id?e.jsx("div",{className:"w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"}):e.jsx(ve,{className:"w-5 h-5"})})})]}),E[r._id]&&e.jsxs("div",{className:"mt-4 bg-white/5 rounded-lg border border-white/10 p-4 transition-all duration-300 ease-in-out",children:[e.jsxs("h5",{className:"text-sm font-medium text-gray-300 mb-3",children:["Generar Reporte - ",((D=r.user)==null?void 0:D.name)||"Barbero"]}),e.jsxs("div",{className:"space-y-3",children:[e.jsxs("button",{onClick:()=>q(r._id,null,j,()=>H(r._id)),className:"w-full text-left px-3 py-2 text-sm bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors flex items-center gap-2",children:[e.jsx(se,{className:"w-4 h-4"}),"Reporte del día actual"]}),e.jsx("div",{className:"border-t border-gray-700/50"}),e.jsxs("div",{children:[e.jsx("div",{className:"text-xs text-gray-500 font-medium mb-2",children:"Seleccionar fecha específica:"}),((v=$[r._id])==null?void 0:v.length)>0?e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{children:[e.jsx("div",{className:"text-xs text-gray-500 font-medium mb-2",children:"Períodos rápidos:"}),e.jsxs("div",{className:"grid grid-cols-2 gap-2",children:[e.jsx("button",{onClick:()=>U(r._id,1,$,j,A),className:"px-2 py-1.5 text-xs bg-green-600/20 text-green-400 rounded-md hover:bg-green-600/30 transition-colors",children:e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-medium",children:"Ayer"}),e.jsx("div",{className:"text-[10px] opacity-75",children:(()=>{const i=new Date;return i.setDate(i.getDate()-1),i.toLocaleDateString("es-ES",{day:"2-digit",month:"2-digit"})})()})]})}),e.jsx("button",{onClick:()=>U(r._id,2,$,j,A),className:"px-2 py-1.5 text-xs bg-yellow-600/20 text-yellow-400 rounded-md hover:bg-yellow-600/30 transition-colors",children:e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-medium",children:"Anteayer"}),e.jsx("div",{className:"text-[10px] opacity-75",children:(()=>{const i=new Date;return i.setDate(i.getDate()-2),i.toLocaleDateString("es-ES",{day:"2-digit",month:"2-digit"})})()})]})})]})]}),e.jsxs("div",{children:[e.jsx("div",{className:"text-xs text-gray-500 font-medium mb-2",children:"Fecha específica:"}),e.jsxs("div",{className:"relative",children:[e.jsx("input",{type:"date",className:"w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50",onChange:i=>{const M=i.target.value;M&&re(M,r._id,$,j,A).then(()=>{i.target.value=""})},min:((b=$[r._id])==null?void 0:b.length)>0?$[r._id][$[r._id].length-1]:"",max:((N=$[r._id])==null?void 0:N.length)>0?$[r._id][0]:"",placeholder:"Seleccionar fecha..."}),e.jsx("div",{className:"absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none",children:e.jsx(se,{className:"w-4 h-4 text-gray-500"})})]}),e.jsx("div",{className:"text-xs text-gray-600 bg-gray-800/30 rounded px-2 py-1 mt-1",children:"💡 Solo las fechas con datos están disponibles"})]}),e.jsx("div",{className:"text-xs text-gray-500 font-medium mb-1",children:"Acceso rápido (últimas 5 fechas):"}),e.jsx("div",{className:"grid grid-cols-1 gap-1 max-h-24 overflow-y-auto",children:$[r._id].slice(0,5).map(i=>e.jsxs("button",{onClick:()=>q(r._id,i,j,()=>H(r._id)),className:"text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/10 rounded-md transition-colors flex items-center gap-2",children:[e.jsx(se,{className:"w-3 h-3"}),new Date(i).toLocaleDateString("es-ES",{weekday:"short",day:"numeric",month:"short",year:"numeric"})]},i))})]}):e.jsx("div",{className:"px-3 py-2 text-xs text-gray-500 text-center",children:"No hay fechas disponibles"})]})]})]})]},r._id)})})})]})]}),f&&L&&e.jsxs("div",{className:"fixed inset-0 z-50 flex items-center justify-center p-4",children:[e.jsx("div",{className:"absolute inset-0 bg-black/70 backdrop-blur-sm",onClick:ee}),e.jsxs("div",{className:"relative bg-gray-800/95 backdrop-blur-md border border-gray-700/50 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden",children:[e.jsxs("div",{className:"flex items-center justify-between p-6 border-b border-gray-700/50",children:[e.jsx("h3",{className:"text-xl font-bold",children:e.jsxs(ce,{className:"text-xl font-bold",children:["Reporte del ",new Date(L.date).toLocaleDateString("es-ES")]})}),e.jsxs("div",{className:"flex gap-2",children:[e.jsxs("button",{onClick:ne,className:"px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors flex items-center gap-2",children:[e.jsx(we,{className:"w-4 h-4"}),"Descargar"]}),e.jsx("button",{onClick:ee,className:"p-2 text-gray-400 hover:text-white transition-colors",children:e.jsx(Ne,{className:"w-5 h-5"})})]})]}),e.jsx("div",{className:"p-6 overflow-y-auto max-h-[calc(90vh-120px)]",children:L&&e.jsx("div",{className:"bg-white text-black p-6 rounded-lg font-mono text-sm",dangerouslySetInnerHTML:{__html:J(L).replace(/<!DOCTYPE.*?<body[^>]*>/,"").replace(/<\/body>.*?<\/html>/,"")}})})]})]})]})};export{Ee as default};
