import{S as z,i as G,s as M,N as U,k as h,a as B,l as w,m as N,c as P,h as C,n as d,O as E,b as T,G as y,R as j,af as A,B as O,o as D,_ as R}from"./index-651bd197.js";import{c as b}from"./tslib.es6-78a57ba8.js";import{b as c}from"./paths-b4419565.js";function F(l){let i,a,u,o,r,m,g,f,_=[{loading:"lazy"},{src:m=l[1]!=="webpage"?`${c}/images/${l[1]}/${b.placeholder_id}.png`:void 0},{title:g=l[7]?l[8]?`failed to load ${l[1]} ${l[0]}`:l[2]||l[0]:"loading..."},{alt:f=l[2]||l[0]},l[3]],t={};for(let e=0;e<_.length;e+=1)t=U(t,_[e]);return{c(){i=h("picture"),a=h("source"),o=B(),r=h("img"),this.h()},l(e){i=w(e,"PICTURE",{class:!0});var n=N(i);a=w(n,"SOURCE",{srcset:!0,type:!0}),o=P(n),r=w(n,"IMG",{loading:!0,src:!0,title:!0,alt:!0}),n.forEach(C),this.h()},h(){d(a,"srcset",u=l[1]!=="webpage"?`${c}/images/${l[1]}_webp/${b.placeholder_id}.webp`:void 0),d(a,"type","image/webp"),E(r,t),d(i,"class",l[4])},m(e,n){T(e,i,n),y(i,a),l[10](a),y(i,o),y(i,r),l[11](r)},p(e,[n]){n&2&&u!==(u=e[1]!=="webpage"?`${c}/images/${e[1]}_webp/${b.placeholder_id}.webp`:void 0)&&d(a,"srcset",u),E(r,t=j(_,[{loading:"lazy"},n&2&&!A(r.src,m=e[1]!=="webpage"?`${c}/images/${e[1]}/${b.placeholder_id}.png`:void 0)&&{src:m},n&391&&g!==(g=e[7]?e[8]?`failed to load ${e[1]} ${e[0]}`:e[2]||e[0]:"loading...")&&{title:g},n&5&&f!==(f=e[2]||e[0])&&{alt:f},n&8&&e[3]])),n&16&&d(i,"class",e[4])},i:O,o:O,d(e){e&&C(i),l[10](null),l[11](null)}}}function H(l,i,a){let{img:u}=i,{type:o}=i,{alt:r=void 0}=i,{props:m={}}=i,{force_png:g=!1}=i,{picture_class:f="inline-block"}=i,_,t,e=!1,n=!1;D(()=>{const s=`${c}/images/${o}/${u}.png`,I=`${c}/images/${o}_webp/${u}.webp`;let k=!1;const p=new Image;p.src=g?s:I,p.onload=()=>{a(7,e=!0),t&&a(6,t.src=s,t),_&&a(5,_.srcset=!g&&!k?I:s,_)},p.onerror=()=>{p.src.indexOf(s)<=-1?(k=!0,p.src=s):a(8,n=!0)}});function S(s){R[s?"unshift":"push"](()=>{_=s,a(5,_)})}function q(s){R[s?"unshift":"push"](()=>{t=s,a(6,t)})}return l.$$set=s=>{"img"in s&&a(0,u=s.img),"type"in s&&a(1,o=s.type),"alt"in s&&a(2,r=s.alt),"props"in s&&a(3,m=s.props),"force_png"in s&&a(9,g=s.force_png),"picture_class"in s&&a(4,f=s.picture_class)},[u,o,r,m,f,_,t,e,n,g,S,q]}class Q extends z{constructor(i){super(),G(this,i,H,F,M,{img:0,type:1,alt:2,props:3,force_png:9,picture_class:4})}}export{Q as I};
