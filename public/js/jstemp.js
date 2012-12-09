var undef=null;
var af={};
var htroot=document.location.href.match(/(.+\/)/);
htroot=htroot[1].replace(/\/cgi-bin/, '');

function each(o, fn)
{
  if(!o || !fn)
    return;

  for(var i=0; i<o.length; ++i)
  {
    var r=fn(o[i], i);
    if(r!==undefined)
      return r;
  }
}
function extend(o, e)
{
  for(var k in e)
    o[k]=e[k];
  return o;
}

function GetStyle(el)
{
  return window.getComputedStyle!==undefined ? window.getComputedStyle(el, null) : el.currentStyle;
}

function RemoveClass(e, c)
{
  var re=new RegExp(c+' *');
  e.className=e.className.replace(re, "").replace(/ +$/, "");
}
function AddClass(e, c)
{
  RemoveClass(e, c);
  e.className+=" "+c;
}
function TestClass(e, c)
{
  var re=new RegExp('\\b'+c+'\\b');
  return (e && e.className && e.className.match(re));
}

function GetPosition(el, fixed)
{
/*
  if(window.getComputedStyle===undefined)
  {
    var x=0;
    var y=0;
    if (el.offsetParent)
    {
      while(el)
      {
        x+=el.offsetLeft;
        y+=el.offsetTop;
        el=el.offsetParent;
      }
//    if(GetCurrentStyle(el,'position')=='fixed') //ie, opera
//    {
//      x+=el.offsetLeft;
//      y+=el.offsetTop;
//    }
    }
    return {x:x, y:y};
  }
*/

  var pos=el.getBoundingClientRect();
  var st=0;
  var sl=0;
  if(!fixed)
  {
    st=window.pageYOffset || document.body.scrollTop;
    sl=window.pageXOffset || document.body.scrollLeft;
  }
  return {x:pos.left+sl, y:pos.top+st};

}

function AttachEvent(o, e, fn, cap)
{
  var handle={'object':o, 'event':e, 'cap':cap};
  if(o.addEventListener)
  {
    handle.fn=function(e)
    {
      var r=fn.call(o, e);
      if(r!==false)
        return;
      e.preventDefault();
      e.stopPropagation();
    }
    o.addEventListener(e, handle.fn, cap ? true : false);
  }
  else
  {
    handle.fn=function()
    {
      var e=window.event;
      e.target=e.srcElement;
      e.returnValue=fn.call(o, e);
    }
    o.attachEvent('on'+e, handle.fn);
  }
  return handle;
}
function DetachEvent(handle)
{
  if(handle.object.removeEventListener)
    handle.object.removeEventListener(handle.event, handle.fn, handle.cap ? true : false);
  else
    handle.object.detachEvent('on'+handle.event, handle.fn);
}
function FireEvent(o, e)
{
  if(document.createEvent)
  {
    var ev=document.createEvent('HTMLEvents');
    ev.initEvent(e, true, true);
    o.dispatchEvent(ev);
  }
  else
    o.fireEvent("on"+e);
}

function Dumper(o)
{
  if(o===null)
    return "null";
  if(o===undefined)
    return "undefined";
  if(typeof(o)=="number")
    return o.toString();
  if(typeof(o)=="boolean")
    return o ? "true" : "false";
  if(typeof(o)=="string")
    return "'"+o.replace(/([\\'])/g, "\\$1")+"'";

  if(typeof(o)=="object")
  {
if(o.nodeType)
  return "node";
    if(typeof(o.length)=="number")
    {
      var a=new Array();
      for(var i=0; i<o.length; i++)
        a.push(Dumper(o[i]));
      return "["+a.join(',')+"]";
    }
    else
    {
      var a=new Array();
      for(var k in o)
        a.push(Dumper(k)+":"+Dumper(o[k]));
      return "{"+a.join(',')+"}";
    }
  }
  return "unknown"
}

function TreeWalk(tree, fn, param)
{
  var r=fn(tree, param); //0 - продолжаем обход, 1 - не входить в поддерево, 2 - закончить обход
  if(r)
    return r;
  for(var n=tree.firstChild; n; n=n.nextSibling)
  {
    if(TreeWalk(n, fn, param)==2)
      return 2;
  }
}

function Html(h, appendto)
{
  h=h.replace(/\$(\w+)/g, " data-lb='$1' ");
  h=h.replace(/^\s+/, "");
  var tag=h.match(/^<(\w+)/i)[1].toLowerCase();

  var wrm={
            'tr': [2, "<table><tbody>", "</tbody></table>"],
            'td': [3, "<table><tbody><tr>", "</tr></tbody></table>"],
            'th': [3, "<table><tbody><tr>", "</tr></tbody></table>"]
          };
  var wr=wrm[tag];
  if(wr)
    h=wr[1]+h+wr[2];

  var d=document.createElement('DIV');
  d.innerHTML=h;

  if(wr)
    for(var i=wr[0]; i; --i)
      d=d.firstChild;

  var h={};
  var i=0;
  TreeWalk(d, function(e)
  {
    if(!e.getAttribute)
      return;
    var n=e.getAttribute('data-lb');
    if(!n)
      return;

    ++i;
    h[n]=e;
    e.removeAttribute('data-lb');
  });
  if(!i)
    h=d.firstChild;
  if(!appendto)
    return h;

  var e;
  while(e=d.firstChild)
    appendto.appendChild(e);

  return h;
}

if (typeof XMLHttpRequest == "undefined") {
  XMLHttpRequest = function () {
    try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); }
      catch (e1) {}
    try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); }
      catch (e2) {}
    try { return new ActiveXObject("Msxml2.XMLHTTP"); }
      catch (e3) {}
    try { return new ActiveXObject("Microsoft.XMLHTTP"); }
      catch (e4) {}
    throw new Error("This browser does not support XMLHttpRequest.");
  };
}

function SendRequest(url, data, fn)
{
  var request=new XMLHttpRequest();

  if(fn)
    request.onreadystatechange = function()
    {
      if(request.readyState==4)
        fn(request.status==200 ? request.responseText : null)
    };

  if(!data)
  {
    request.open("GET", url, true);
    request.send();
    return;
  }
  
  if(typeof(data)=="object")
  {
    var d=[];
    for(var k in data)
    {
      var v=data[k];
      if(typeof(v)!="string")
        v=Dumper(v);
      d.push(k+"="+encodeURIComponent(v));
    }
    data=d.join('&');
  }

  request.open("POST", url, true);
  request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  request.send(data);
}

function InsertFlash(swf, width, height, transparent, param)
{
  if(transparent)
    param['wmode']='transparent';

  var t1='';
  var t2='';
  for(var k in param)
  {
    var v=param[k];
    t1+='<param name="'+k+'" value="'+v+'"/>';
    t2+=k+'="'+v+'" ';
  }

  document.write(
'<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=5,0,0,0" width="'+width+'" height="'+height+'">\
  <param name="movie" value="'+swf+'">\
  <param name="quality" value="high">\
  <param name="play" value="true">\
  '+t1+'\
  <PARAM name="wmode" value="transparent"/>\
 <embed src="'+swf+'" '+t2+' width="'+width+'" height="'+height+'" quality="high" play="true" loop="true"></embed>\
</object>\
');
}

function GetCookie(Name, Eval)
{
  var pl=document.cookie.split(/ *; */);
  for(var i=0; i<pl.length; ++i)
  {
    var r=pl[i].split(/ *= */);
    if(r[0]!=Name)
      continue;
    if(!Eval)
      return r[1];

    try
    {
      eval("r="+unescape(r[1]));
    }
    catch(e)
    {
      r=null;
    }
    return r;
  }
  return null;
}
function SetCookie(Name, val)
{
  if(typeof(val)=="object")
    val=escape(Dumper(val));
  var expir=new Date();
  expir.setTime(expir.getTime() + (1000*24*60*60*1000));
  document.cookie=Name+"="+val+"; expires="+expir.toGMTString()+"; path=/";
}

////////////////////////////////////////////////////////////////////////////////////////////


function Change3state(element,eid)
{
  var e=document.getElementById(eid);
  var state=parseInt(e.value);  //element.getAttribute('c3state')
  state=state>1 ? 0 : state+1;
  element.src=element.src.replace(/\d\.gif$/, (state+1)+".gif");
  e.value=state;
}

function GetElements(e)
{
  var uenum=e.udata.data;
  var ulinks=e.udata.links;
  for(var j=0; j<ulinks.length; ++j)
  {
    var l=ulinks[j];
/*
    var ind=l.selectedIndex;
    var s=l.options[ind];
    s=s.value;
*/
    var s=l.value;
    var ue=uenum[s];
    if(!ue)
      ue=[];

    if(l.udata.type=='tree')
    {
      var p=l.xdata.map[s].xdata.parent;
      while(p)
      {
        var s=p.xdata.id;
        var u=uenum[s];
        if(!u)
          u=[];
        ue=u.concat(ue);
        p=p.xdata.parent;
      }
    }
    uenum=ue;
  }
  return uenum;
}

function InitCombo(e)
{
  var uenum=GetElements(e);

  if(e.udata.imp)
    uenum.unshift([0,e.udata.imp]);

  if(window.opera)    // Opera fix
  {
    var o="";
    for(var j=0; j<uenum.length; ++j)
    {
      var it=uenum[j];
      var s="";
      var name=it.length<2 ? it[0] : it[1];
      if(it[0]==e.udata.def || (j==0 && !e.udata.def))
        s="selected";
      o+="<option value='"+it[0]+"' "+s+">"+name+"</option>";
    }
    e.innerHTML=o;
  }
  else
  {
    var col=e.options;
    while(col.length>0)
      e.remove(0);

    for(var j=0; j<uenum.length; ++j)
    {
      var it=uenum[j];
      var opt=document.createElement('OPTION');
      opt.value=it[0];
      opt.text=it.length<2 ? it[0] : it[1];
      if(it[0]==e.udata.def || (j==0 && !e.udata.def))
        opt.selected=true;
      col.add(opt);
    }
  }
}
function ReadUnion(e)
{
  e=document.getElementById(e);
  var il=e.udata.inp.getElementsByTagName('INPUT');
  var a=[];
  for(var i=0; i<il.length; ++i)
  {
    var vl=il[i].id.split('_');
    var v=vl.pop();
    if(il[i].checked)
      a.push(v);
    if(e.udata.type=='union3')
    {
      var f=parseInt(il[i].value);
      if(f!=2)
        a.push(f ? v : "!"+v);
    }
  }
  a=a.join(',');
  e.value=a;
}
function InitUnion(e)
{
  if(!e.value)
    e.value=e.udata.def;
  var uenum=GetElements(e);

  var d={};
  each(e.value.split(','), function(k)
  {
    var v=1;
    var r=k.match(/^!(\d+)$/);
    if(r)
    {
      k=r[1];
      v=0;
    }
    d[k]=v;
  })

  var html="";
  each(uenum, function(it)
  {
    var id=e.id+"_"+it[0];
    if(e.udata.type=='union')
    {
      var c=d[it[0]] ? "checked" : "";
      html+="<nobr><input id='"+id+"' type='checkbox' onchange='ReadUnion(\""+e.id+"\")' "+c+"><label for='"+id+"'>&nbsp;"+it[1]+"</label></nobr><br>";
    }
    else
    {
      var c=d[it[0]];
      if(typeof(c)=="undefined")
        c=2;
      html+="<input id='"+id+"' type='hidden' value='"+c+"'><img onclick='Change3state(this,\""+id+"\");ReadUnion(\""+e.id+"\")' src='"+htroot+"check"+(c+1)+".gif'><span>&nbsp;"+it[1]+"</span><br>";
    }
  });
  e.udata.inp.innerHTML=html;
  ReadUnion(e.id);
}
function InitTree(e)
{
  var n=document.createElement('INPUT');
  n.type='text';
  n.readOnly=true;
  n.style.width="100%";
  n.xdata={};
  n.onclick=function()
  {
    var s=this.xdata.childs.style;
    if(s.display=="block")
      s.display="none";
    else
      s.display="block";
  }
  e.udata.inp.appendChild(n);

  e.xdata={'map':{}, 'stat':n};

  function Set(root, id)
  {
    var el=root.xdata.map[id];

    if(!el)
      el=root.xdata.map[root.udata.data.childs[0].data[1]];
    id=el.xdata.id;

    root.value=id;
    if(root.onchange)
      root.onchange();

    var old=root.xdata.sel;
    if(old)
    {
      var cn=old.className.split(' ');
      old.className=cn[0];
    }
    el.className+=" atselected";
    root.xdata.sel=el;

    var stat=[];
    while(el)
    {
      stat.unshift(el.innerHTML);
      el=el.xdata.parent;
      if(el && el.xdata.childs)
        el.xdata.childs.style.display="block";
    }
    root.xdata.stat.value=stat.join(' / ');
  }
  function PrintTree(t, root, parent)
  {
    var childs="";
    var n2=t.data ? document.createElement('DIV') : "";

    if(typeof(t.childs)!="undefined")
    {
      childs=document.createElement('DIV');
      for(var i=0; i<t.childs.length; ++i)
      {
        var e=PrintTree(t.childs[i], root, n2);
        childs.appendChild(e);
      }
    }
    if(typeof(t.data)=="undefined")
      return childs;

    n2.xdata={'root':root, 'parent':parent, 'childs':childs, 'id':t.data[1]};
    root.xdata.map[t.data[1]]=n2;
    n2.innerHTML=t.data[0];

    var n=document.createElement('DIV');
    n.appendChild(n2);

    n2.onclick=function()
    {
      var c=this.xdata.childs;
      if(c)
      {
        if(c.style.display=="block")
          c.style.display="none";
        else
          c.style.display="block";
      }

      Set(this.xdata.root, this.xdata.id);
    }
    if(childs)
    {
      n2.className="atnode";
      childs.style.paddingLeft="10px";
      childs.style.display="none";
      n.appendChild(childs);
    }
    else
      n2.className="atleaf";

    return n;
  }

  if(e.udata.imp)
    e.udata.data.childs.unshift({'data':[e.udata.imp, 0]});

  var n2=PrintTree(e.udata.data, e);
  n2.style.display="none";
  n.xdata.childs=n2;


  Set(e, e.value ? e.value : e.udata.def);

  e.udata.inp.appendChild(n2);
}

var hvalidate={'mandatory':'.', 'int':'^\\d+$', 'float':'^\\d+([.,])?(\\d+)?$', 'email':'^[\\w-.]+@[\\w-]+\\.[\\w-.]+$', 'date':'^(\\d\\d?)\\.(\\d\\d?)\\.(\\d\\d\\d\\d)$'};
function ValidateField(e, value)
{
  var validate=e.getAttribute('uitype');
  if(!validate)
    return true;

  var uiname=e.getAttribute('uiname');
  var vl=validate.split(',');
  for(var j=0; j<vl.length; ++j)
  {
    var v=hvalidate[vl[j]];
    if(!v)
      continue;
    var re=new RegExp(v, "i");

    var msg="";
    if(vl[j]=='mandatory')
    {
      if(!value)
        msg="Не заполнено поле '";
    }
    else if(value && !re.test(value))
      msg="Неправильно заполнено поле '";
    if(msg!="")
    {
      alert(msg+uiname+"'");
      e.focus();
      return false;
    }
  }
  return true;
}
function ValidateForm(form)
{
  for(var i=0; i<form.elements.length; ++i)
  {
    var e=form.elements[i];
    if(!ValidateField(e, e.value))
      return false;
  }
  return true;
}


function GetColumn(elem)
{
  var cell;
  for(var table=elem.offsetParent; table; table=table.offsetParent)
  {
    if(table.tagName=="TD")
      cell=table;
    if(table.tagName!="TABLE")
      continue;
    if(table.id=="rtable")
      break;
  }
  if(!table || !cell)
    return [];

  var cindex=0;
  while(cell.previousSibling)
  {
    ++cindex;
    cell=cell.previousSibling;
  }

  var rl=table.rows;
  var r=[];

  for(var i=0; i<rl.length; ++i)
    r.push(rl[i].childNodes[cindex]);
  return r;
}


var m_shift;
var m_alt;
var m_ctrl;
function CheckMod(e)
{
  m_shift=e.shiftKey;
  m_alt=e.altKey;
  m_ctrl=e.ctrlKey;
}
AttachEvent(document, 'keydown', CheckMod);
AttachEvent(document, 'keyup', CheckMod);

AttachEvent(document, 'click', function(e)
{
  var elem=e.target;

  if(!e.shiftKey || elem.tagName!="INPUT" || elem.type!="checkbox")
    return;
  var state=elem.checked;

  var col=GetColumn(elem);
  for(var i=0; i<col.length; ++i)
  {
    var il=col[i].getElementsByTagName('INPUT');
    for(var j=0; j<il.length; ++j)
      if(il[j].type=="checkbox")
        il[j].checked=state;
  }
});


AttachEvent(window, 'load', function()
{
  window.setTimeout(function()
  {
    for(var fid in af)
    {
      for(var field in af[fid])
      {
        var f=af[fid][field];
        var e=document.getElementById("id_"+fid+"_"+field);
        var links=[];
        for(var i=0; i<f.links.length; ++i)
        {
          var l=document.getElementById("id_"+fid+"_"+f.links[i]);
          links.push(l);
          l.udata.rlinks.push(e);
        }
        f.links=links;
        e.udata=f;

        if(f.type=='combo' || f.type=='union' || f.type=='union3' || f.type=='tree')
        {
          if(f.type=='combo')
          {
            f.Init=InitCombo;
            CreateFilteredSelect(e);
          }
          else
          {
            f.Init=f.type=='tree' ? InitTree : InitUnion;

            var inp=document.createElement('DIV');
            inp.style.textAlign='left';
            f.inp=inp;
            e.parentNode.insertBefore(inp, e);
          }

          e.onchange=function(e, st)
          {
            if(m_shift && !st)
            {
              var col=GetColumn(this);
              for(var i=0; i<col.length; ++i)
              {
                var il=col[i].getElementsByTagName('SELECT');
                for(var j=0; j<il.length; ++j)
                {
                  il[j].value=this.value;
                  il[j].onchange(0, 1);
                }
              }
            }

            for(var f=0; f<this.udata.rlinks.length; ++f)
            {
              var r=this.udata.rlinks[f];
              r.udata.Init(r);
            }
          }
        }
        f.Init(e);
      }
    }

    each(document.getElementsByTagName('INPUT'), function(e)
    {
      if(e.className!='ChangeInpType')
        return;
      var id=e.getAttribute('data-asid');
      e.onclick=function()
      {
        var el=document.getElementById(id);
        var type=e.checked ? "text" : "file";
        if(el.type==type)
          return;
        var ne=document.createElement("INPUT");
        el.parentNode.replaceChild(ne, el);
        ne.type=type;
        ne.id=el.id;
        ne.name=el.name;
        ne.style.cssText=el.style.cssText;
      }
      e.onclick();
    });
  }, 1);
});


function AddElement(type, fid, field, data, links, def, imp)
{
  if(!af[fid])
    af[fid]={};
  if(!links)
    links=[];
  if(!def)
    def="";

  af[fid][field]={'type':type, 'data':data, 'links':links, 'rlinks':[], 'def':def, 'imp':imp};
  if(type=='combo')
  {
    document.write('<select name="'+field+'" id="id_'+fid+'_'+field+'" style="width:100%"></select>');
  }
  if(type=='union' || type=='union3' || type=='tree')
    document.write('<input style="display:none" name="'+field+'" id="id_'+fid+'_'+field+'">');
}



////////////////////////////////////////////////////////////////////////////////////////////

function IsFixed(el)
{
  while(el.parentNode)
  {
    if(GetStyle(el).position=="fixed")
      return true;
    el=el.parentNode;
  }
  return false;
}

function CreateDropdown(elem, content, param)
{
  if(!param)
    param={};

  var fx=IsFixed(elem);
  var pos=GetPosition(elem, fx);
  pos.y+=elem.offsetHeight-1;
  var t=Html("<div style='z-index:200000; position:absolute; color:#000000; background-color:#ffffff; border:1px solid #000000; box-sizing: border-box;'></div>", document.body);

  if(fx)
    t.style.position='fixed';

  t.style.top=pos.y+"px";
  t.style.left=pos.x+"px";

  if(param.height)
  {
    t.style.maxHeight=param.height+"px";
    t.style.overflow='auto';
  }
  if(param.width)
    t.style.minWidth=param.width+"px";
  
  t.appendChild(content);

  if(GetPosition(t, 1).y+t.offsetHeight>window.innerHeight)
    t.style.top=(pos.y-t.offsetHeight-elem.offsetHeight+2)+"px";

  if(t.scrollHeight>t.offsetHeight)
  {
    AttachEvent(t, 'mousewheel', function(ev)
    {
      if(this.scrollTop==0 && ev.wheelDelta>0)
        return false;
      if(this.scrollTop==this.scrollHeight-this.clientHeight && ev.wheelDelta<0)
        return false;
    });
//t.style.width=(t.offsetWidth+24)+"px"; //fix Opera
  }

  var r={
    close: function()
    {
      if(r.closed)
        return;

      r.closed=true;
      if(param.onclose && param.onclose()===false)
      {
        r.closed=false;
        return;
      }

      window.setTimeout(function()
      {
        DetachEvent(kevent);
        DetachEvent(cevent);
        document.body.removeChild(t);
      }, 1);
    },
    element: t
  };

  var cevent;
  var kevent=AttachEvent(document, window.opera ? 'keypress' : 'keydown', function(ev)
  {
    if(param.onkey && param.onkey(ev)===false)
      return false;
    if(ev.keyCode==27)
      r.close();
  }, 1);
  window.setTimeout(function()
  {
    cevent=AttachEvent(document, 'mousedown', function(ev)
    {
      for(var n=ev.target; n && n!=t; n=n.parentNode);
      if(n && param.onclick && param.onclick(ev)===false)
        return;
      r.close();
    }, 1);
  }, 1);

  return r;
}

function CreateDropSelect(elem, options, param)
{
  var t=Html("<div class='ipe_drop_select'></div>");
  var cur;
  function SetCur(n)
  {
    if(cur)
      RemoveClass(cur, "ipe_drop_select_sel");
    if(n)
      AddClass(n, "ipe_drop_select_sel");
    cur=n;
  }
  function Scroll(n)
  {
    if(!n)
      return;
    if(n.offsetTop<t.parentNode.scrollTop)
      n.scrollIntoView(true);
    else if((n.offsetTop+n.offsetHeight)>(t.parentNode.scrollTop+t.parentNode.offsetHeight))
      n.scrollIntoView(false);
  }

  var first;
  var last;
  each(options, function(o)
  {
    var cr=o[0]==param.current ? "class='ipe_drop_select_cur ipe_drop_select_sel'" : "";
    var r=Html("<div "+cr+">"+o[1]+"</div>", t);
    if(!first)
      first=r;
    last=r;
    if(o[0]==param.current)
      cur=r;
    r.onmouseover=function()
    {
      SetCur(this);
    }
    r.CDSOption=o[0];
  });
  if(!cur)
    SetCur(first);

  var r=CreateDropdown(elem, t, {'height':240, 'width':elem.offsetWidth, 'onclose':param.onclose, 'onclick':function(ev)
  {
    for(var n=ev.target; n && !("CDSOption" in n); n=n.parentNode);
    if(!n)
      return false;
    param.onselect(n.CDSOption);
  }, 'onkey':function(ev)
  {
//33 PgUp
//34 PgDn
    var key=ev.keyCode;
    if(key==38 || key==40 || key==35 || key==36) // Up, Down, End, Home 
    {
      if(!cur)
        return false;

      if(key==38)
        n=cur.previousSibling;
      if(key==40)
        n=cur.nextSibling;
      if(key==35)
        n=last;
      if(key==36)
        n=first;
      if(!n || n.nodeType!=1 || n.tagName!='DIV')
        return false;

      Scroll(n);
      SetCur(n);
      return false;
    }

    if(key==13 || key==10) // Enter
    {
      window.setTimeout(function()
      {
        if(cur)
          param.onselect(cur.CDSOption);
        r.close();
      }, 1);
      return false;
    }
  }});

  Scroll(cur);
  return r;
}

function CreateFilteredSelect(e)
{
  if(!e.addEventListener)
    return;

  AttachEvent(e, window.opera ? 'click' : 'mousedown', function(ev) //mousedown
  {
    var inp=Html("<input style='position:absolute'>");
    var sstyle=GetStyle(e);
    inp.style.display=sstyle.display;

    function CopyStyle(el, style, list)
    {
      each(list || ['fontFamily', 'fontSize', 'fontStyle', 'fontVariant', 'fontWeight', 'color', 'backgroundColor'], function(s)
      {
        if(style[s]!='transparent')
          el.style[s]=style[s];
      });
    }
    CopyStyle(inp, sstyle);
    CopyStyle(inp, sstyle, ['width']); //'height', 'paddingTop', 'paddingBottom', 'marginTop', 'marginBottom'

    var ovis=e.style.visibility;
    e.style.visibility='hidden';

    var par=e.parentNode;
    par.insertBefore(inp, e);
par.removeChild(e); //fix firefox
par.insertBefore(e, inp.nextSibling);
    inp.focus();

    function drop()
    {
      function close()
      {
        ctr.close();
        e.parentNode.removeChild(inp);
        e.style.visibility=ovis;
      }
      function filt(s)
      {
        return s.toLowerCase().replace(/\s+/g, " ").replace(/^ | $/g, "");
      }
      
      var ol=[];
      var current=e.selectedIndex;
      var filter=filt(inp.value);
      var ix=-1;
      each(e.options, function(o)
      {
        ++ix;
        var v=filt(o.innerHTML);
        if(v.indexOf(filter)<0)
          return;

        ol.push([ix, o.innerHTML]);
      });
      var ctr=CreateDropSelect(inp, ol, {'current':current, 'onselect':function(n)
      {
        if(e.selectedIndex==n)
          return;

        e.selectedIndex=n;
        FireEvent(e, 'change');
      }, 'onclose':function()
      {
        if(!ctr.Refresh)
          close();
      }});
      CopyStyle(ctr.element, sstyle);

      inp.onkeyup=function()
      {
        if(ctr.closed || filter==filt(inp.value))
          return;
        ctr.Refresh=1;
        ctr.close();
        drop();
      };
//      inp.onblur=function()
//      {
//        close();
//      }
    }

    drop();
    return false;
  });
}
