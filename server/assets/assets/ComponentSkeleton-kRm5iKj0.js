import{g as $,b as T,r as x,c as B,_ as A,d as h,j as t,e as F,f as L,s as k,h as P,i as j,k as y,B as R,S as l,T as c,G as r,M as X,P as E}from"./index-C1Ilm59R.js";function N(a){return String(a).match(/[\d.\-+]*\s*(.*)/)[1]||""}function W(a){return parseFloat(a)}function G(a){return $("MuiSkeleton",a)}T("MuiSkeleton",["root","text","rectangular","rounded","circular","pulse","wave","withChildren","fitContent","heightAuto"]);const K=["animation","className","component","height","style","variant","width"];let p=a=>a,v,w,b,C;const D=a=>{const{classes:i,variant:s,animation:n,hasChildren:o,width:u,height:d}=a;return L({root:["root",s,n,o&&"withChildren",o&&!u&&"fitContent",o&&!d&&"heightAuto"]},G,i)},O=y(v||(v=p`
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }

  100% {
    opacity: 1;
  }
`)),V=y(w||(w=p`
  0% {
    transform: translateX(-100%);
  }

  50% {
    /* +0.5s of delay between each loop */
    transform: translateX(100%);
  }

  100% {
    transform: translateX(100%);
  }
`)),q=k("span",{name:"MuiSkeleton",slot:"Root",overridesResolver:(a,i)=>{const{ownerState:s}=a;return[i.root,i[s.variant],s.animation!==!1&&i[s.animation],s.hasChildren&&i.withChildren,s.hasChildren&&!s.width&&i.fitContent,s.hasChildren&&!s.height&&i.heightAuto]}})(({theme:a,ownerState:i})=>{const s=N(a.shape.borderRadius)||"px",n=W(a.shape.borderRadius);return h({display:"block",backgroundColor:a.vars?a.vars.palette.Skeleton.bg:P(a.palette.text.primary,a.palette.mode==="light"?.11:.13),height:"1.2em"},i.variant==="text"&&{marginTop:0,marginBottom:0,height:"auto",transformOrigin:"0 55%",transform:"scale(1, 0.60)",borderRadius:`${n}${s}/${Math.round(n/.6*10)/10}${s}`,"&:empty:before":{content:'"\\00a0"'}},i.variant==="circular"&&{borderRadius:"50%"},i.variant==="rounded"&&{borderRadius:(a.vars||a).shape.borderRadius},i.hasChildren&&{"& > *":{visibility:"hidden"}},i.hasChildren&&!i.width&&{maxWidth:"fit-content"},i.hasChildren&&!i.height&&{height:"auto"})},({ownerState:a})=>a.animation==="pulse"&&j(b||(b=p`
      animation: ${0} 2s ease-in-out 0.5s infinite;
    `),O),({ownerState:a,theme:i})=>a.animation==="wave"&&j(C||(C=p`
      position: relative;
      overflow: hidden;

      /* Fix bug in Safari https://bugs.webkit.org/show_bug.cgi?id=68196 */
      -webkit-mask-image: -webkit-radial-gradient(white, black);

      &::after {
        animation: ${0} 2s linear 0.5s infinite;
        background: linear-gradient(
          90deg,
          transparent,
          ${0},
          transparent
        );
        content: '';
        position: absolute;
        transform: translateX(-100%); /* Avoid flash during server-side hydration */
        bottom: 0;
        left: 0;
        right: 0;
        top: 0;
      }
    `),V,(i.vars||i).palette.action.hover)),e=x.forwardRef(function(i,s){const n=B({props:i,name:"MuiSkeleton"}),{animation:o="pulse",className:u,component:d="span",height:g,style:S,variant:_="text",width:M}=n,m=A(n,K),f=h({},n,{animation:o,component:d,variant:_,hasChildren:!!m.children}),U=D(f);return t.jsx(q,h({as:d,ref:s,className:F(U.root,u),ownerState:f},m,{style:h({width:M,height:g},S)}))}),z=k(R)(({theme:a})=>({paddingLeft:a.spacing(3),paddingTop:a.spacing(3),marginBottom:a.spacing(3),[a.breakpoints.down("md")]:{padding:a.spacing(2)},[a.breakpoints.down("sm")]:{padding:a.spacing(1.5)}}));function H({children:a}){const[i,s]=x.useState(!0);x.useEffect(()=>{s(!1)},[]);const n=t.jsx(X,{title:t.jsx(e,{sx:{width:{xs:120,md:180}}}),secondary:t.jsx(e,{animation:"wave",variant:"circular",width:24,height:24}),children:t.jsxs(l,{spacing:1,children:[t.jsx(e,{}),t.jsx(e,{sx:{height:64},animation:"wave",variant:"rectangular"}),t.jsx(e,{}),t.jsx(e,{})]})});return t.jsxs(t.Fragment,{children:[i&&t.jsxs(t.Fragment,{children:[t.jsxs(R,{sx:{pl:2.5},children:[t.jsxs(l,{spacing:1.25,children:[t.jsx(c,{variant:"h2",children:t.jsx(e,{})}),t.jsx(c,{variant:"h6",color:"text.secondary",children:t.jsx(e,{})})]}),t.jsxs(r,{container:!0,spacing:.75,sx:{mt:1.75},children:[t.jsx(r,{item:!0,xs:12,children:t.jsx(c,{variant:"caption",color:"text.secondary",children:t.jsxs(l,{direction:"row",spacing:1,children:[t.jsx(e,{animation:"wave",variant:"circular",width:16,height:16}),t.jsx(e,{sx:{width:{xs:250,md:450}}})]})})}),t.jsx(r,{item:!0,xs:12,children:t.jsx(c,{variant:"caption",color:"text.secondary",children:t.jsxs(l,{direction:"row",spacing:1,children:[t.jsx(e,{animation:"wave",variant:"circular",width:16,height:16}),t.jsx(e,{sx:{width:{xs:250,md:450}}})]})})})]})]}),t.jsx(z,{children:t.jsxs(r,{container:!0,spacing:3,children:[t.jsx(r,{item:!0,xs:12,md:6,children:n}),t.jsx(r,{item:!0,xs:12,md:6,children:n}),t.jsx(r,{item:!0,xs:12,md:6,children:n}),t.jsx(r,{item:!0,xs:12,md:6,children:n})]})})]}),!i&&a]})}H.propTypes={children:E.node};export{H as C,z as a};
