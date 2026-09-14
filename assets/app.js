/* Independent, offline frontend. No WordPress, Elementor, framework or remote API. */
(() => {
  'use strict';
  const products = window.LEGO_PRODUCTS;
  const categories = window.LEGO_CATEGORIES;
  const $ = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => [...root.querySelectorAll(q)];
  const fa = value => Number(value).toLocaleString('fa-IR');
  const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  const img = name => `assets/images/${name}.webp`;
  const original = name => `assets/originals/${name}`;
  const findProduct = id => products.find(product => product.id === Number(id));
  const readStorage = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  };
  const saveStorage = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* file:// privacy mode still works in memory */ } };
  let deadline = Number(readStorage('famito-html-timer-v1',0));
  if (!Number.isFinite(deadline) || deadline < Date.now()) deadline = Date.now()+4.5*3600000;
  saveStorage('famito-html-timer-v1',deadline);
  let storedCart = readStorage('famito-html-cart-v1', []);
  let cart = Array.isArray(storedCart) ? storedCart.filter(row => row && findProduct(row.id) && Number.isInteger(row.quantity) && row.quantity > 0 && row.quantity <= 99) : [];
  let storedFavorites = readStorage('famito-html-favorites-v1', []);
  let favorites = Array.isArray(storedFavorites) ? storedFavorites.filter(id => findProduct(id)) : [];
  let compare = [];
  let toastTimeout;

  function toast(message) {
    const element = $('.toast');
    element.textContent = message;
    element.classList.add('visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => element.classList.remove('visible'), 3500);
  }
  function showDialog(element) {
    if (!element.open) element.showModal();
  }
  function specs(product) {
    if (!product.pieces) return '';
    return `<div class="card-specs">${[
      ['brick',fa(product.pieces),'تعداد قطعات'],
      ['age',`${fa(product.age)}+`,'رده سنی'],
      ['material','پلاستیک','جنس'],
      ['figure',fa(product.figures),'تعداد فیگور']
    ].map(([name,value,label]) => `<div class="spec" title="${label}">${icon(name)}<span aria-label="${label}: ${value}">${value}</span></div>`).join('')}</div>`;
  }
  function price(product) {
    return `<div class="price">${product.oldPrice ? `<del class="old-price">${fa(product.oldPrice)}</del>` : ''}<span>${fa(product.price)}</span><small>تومان</small></div>`;
  }
  function productCard(product, mode = 'archive') {
    const deal = mode === 'deal';
    const discount = product.oldPrice ? Math.round((1-product.price/product.oldPrice)*100) : 0;
    let offer = '';
    if (deal) offer = `<div class="offer-line"><span class="discount-badge">${fa(discount)}٪</span><span class="countdown" data-countdown>۰۰ : ۰۴ : ۳۰ : ۰۰</span></div>`;
    else if (mode === 'archive') offer = `<div class="offer-line ${product.sale ? '' : 'placeholder'}"><span>پیشنهاد ویژه :</span><span class="countdown" data-countdown>۰۰:۰۴:۳۰:۰۰</span></div>`;
    return `<article class="product-card ${deal ? 'deal-card' : ''}" data-product-id="${product.id}">
      ${offer}<button class="product-photo ${product.altImage ? 'has-alt' : ''}" data-quick="${product.id}" aria-label="نمایش ${escapeHTML(product.name)}">
      <img class="primary" src="${img(product.image)}" alt="${escapeHTML(product.name)}" loading="lazy" width="236" height="222">
      ${product.altImage ? `<img class="secondary" src="${img(product.altImage)}" alt="بسته‌بندی ${escapeHTML(product.name)}" loading="lazy" width="236" height="222">` : ''}</button>
      ${mode === 'archive' ? specs(product) : ''}
      <h3 class="card-title"><button data-quick="${product.id}">${escapeHTML(product.name)}</button></h3>
      <div class="card-bottom">${price(product)}${deal ? '<span class="buy-caption">همین حالا<br><strong>بخرش</strong></span>' : ''}<button class="add-to-cart" data-add="${product.id}" aria-label="افزودن ${escapeHTML(product.name)} به سبد">${icon(deal ? 'basket' : 'cart')}</button></div>
    </article>`;
  }

  if ($('#home-categories')) {
    $('#home-categories').innerHTML = categories.map(category => `<a class="category-card category-${category.id}" href="archive.html?category=${category.id}"><span>${category.name}</span><picture>${category.mobile ? `<source media="(max-width: 680px)" srcset="${original(category.mobile)}" width="688" height="445">` : ''}<img src="${original(category.original)}" alt="${category.name}" width="344" height="445" loading="lazy"></picture></a>`).join('');
    $('#deals-track').innerHTML = [2,16,15,14,13,3].map(id => productCard(findProduct(id),'deal')).join('');
    $('#new-track').innerHTML = [20,19,18,17,11,9].map(id => productCard(findProduct(id),'simple')).join('');
  }

  function renderCart() {
    const count = cart.reduce((sum,row) => sum+row.quantity,0);
    $$('.cart-count').forEach(el => { el.textContent = fa(count); });
    $('.cart-items').innerHTML = cart.length ? cart.map(row => {
      const product = findProduct(row.id);
      return `<article class="cart-item"><img src="${img(product.image)}" alt="${escapeHTML(product.name)}"><div><h3>${escapeHTML(product.name)}</h3>${price(product)}<div class="quantity-control"><button data-quantity="${row.id}" data-delta="1" aria-label="افزایش تعداد">+</button><span>${fa(row.quantity)}</span><button data-quantity="${row.id}" data-delta="-1" aria-label="کاهش تعداد">−</button><button class="remove-item" data-remove="${row.id}">حذف</button></div></div></article>`;
    }).join('') : '<p>سبد خرید شما خالی است.</p>';
    $('.cart-total').innerHTML = `<span>جمع سبد خرید</span><strong>${fa(cart.reduce((sum,row) => sum+findProduct(row.id).price*row.quantity,0))} تومان</strong>`;
    saveStorage('famito-html-cart-v1', cart);
  }
  function addToCart(id) {
    const product = findProduct(id);
    if (!product) return;
    const row = cart.find(item => item.id === product.id);
    if (row && row.quantity >= 99) return toast('حداکثر تعداد نمایشی هر محصول ۹۹ عدد است.');
    if (row) row.quantity++; else cart.push({id:product.id,quantity:1});
    renderCart();
    toast('محصول به سبد خرید اضافه شد.');
  }
  function quickView(id) {
    const product = findProduct(id);
    if (!product) return;
    $('.quick-content').innerHTML = `<img src="${img(product.image)}" alt="${escapeHTML(product.name)}"><div><h3>${escapeHTML(product.name)}</h3>${specs(product)}${price(product)}<button class="add-to-cart" data-add="${product.id}">${icon('cart')}افزودن به سبد خرید</button><button class="quick-favorite" data-favorite="${product.id}" aria-pressed="${favorites.includes(product.id)}">${favorites.includes(product.id) ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}</button><br><button class="quick-favorite" data-compare="${product.id}">افزودن به مقایسه</button></div>`;
    showDialog($('.quick-dialog'));
  }
  function info(title, html) {
    $('#info-title').textContent = title;
    $('.info-content').innerHTML = html;
    showDialog($('.info-dialog'));
  }
  function showFavorites() {
    info('علاقه‌مندی‌ها', favorites.length ? `<div class="favorites-list">${favorites.map(id => {
      const p = findProduct(id);
      return `<div class="favorite-row"><img src="${img(p.image)}" alt=""><button data-quick="${id}">${escapeHTML(p.name)}</button><button data-favorite="${id}" aria-label="حذف از علاقه‌مندی‌ها">×</button></div>`;
    }).join('')}</div>` : '<p>هنوز محصولی ذخیره نکرده‌اید. محصول را باز کنید و «افزودن به علاقه‌مندی‌ها» را بزنید.</p>');
  }
  function showCompare() {
    if (!compare.length) return info('مقایسه محصولات','<p>برای انتخاب محصول، نمایش سریع آن را باز کنید و «افزودن به مقایسه» را بزنید. حداکثر سه محصول قابل مقایسه است.</p>');
    const chosen = compare.map(findProduct);
    info('مقایسه محصولات', `<div style="overflow:auto"><table style="border-collapse:collapse;width:100%;font-size:11px"><thead><tr><th>ویژگی</th>${chosen.map(p => `<th style="padding:10px;min-width:120px"><img src="${img(p.image)}" alt="" style="height:75px;margin:auto;object-fit:contain">${escapeHTML(p.name)}<button data-uncompare="${p.id}" aria-label="حذف از مقایسه"> × </button></th>`).join('')}</tr></thead><tbody>${[['قیمت',p=>fa(p.price)+' تومان'],['تعداد قطعات',p=>p.pieces?fa(p.pieces):'—'],['رده سنی',p=>p.age?fa(p.age)+'+':'—'],['تعداد فیگور',p=>p.figures?fa(p.figures):'—']].map(([label,get])=>`<tr><th style="padding:12px;border-top:1px solid #eee">${label}</th>${chosen.map(p=>`<td style="text-align:center;padding:12px;border-top:1px solid #eee">${get(p)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
  }

  let state;
  let visibleProducts = [];
  let page = 1;
  const pageSize = 16;
  const form = $('#filter-form');
  const defaultState = () => ({min:0,max:39500000,stock:false,brand:[],age:[],category:[],query:'',sort:'newest',type:''});
  const categoryNames = Object.fromEntries([...categories.map(c=>[c.id,c.name]),['batman','لگو بتمن'],['vehicles','لگو وسایل نقلیه'],['rings','ارباب حلقه‌ها']]);
  function numberParam(params, key, fallback) {
    const value = params.has(key) ? Number(params.get(key)) : fallback;
    return Number.isFinite(value) ? Math.max(0,Math.min(39500000,value)) : fallback;
  }
  function readURL() {
    const params = new URLSearchParams(location.search);
    state = defaultState();
    state.min = numberParam(params,'min',0);
    state.max = numberParam(params,'max',39500000);
    if (state.min > state.max) [state.min,state.max] = [state.max,state.min];
    state.stock = params.get('stock') === '1';
    state.brand = params.getAll('brand');
    state.category = params.getAll('category');
    state.age = params.getAll('age').map(Number).filter(Number.isFinite);
    state.query = params.get('q') || '';
    const sort = params.get('sort');
    state.sort = ['newest','price-asc','price-desc','stock'].includes(sort) ? sort : 'newest';
    state.type = params.get('type') === 'figure' ? 'figure' : '';
    if (sort && !['newest','price-asc','price-desc','stock'].includes(sort)) toast('مرتب‌سازی محبوبیت و امتیاز به داده‌های واقعی فروشگاه نیاز دارد.');
  }
  function writeURL() {
    const params = new URLSearchParams();
    if (state.query) params.set('q',state.query);
    if (state.min) params.set('min',state.min);
    if (state.max !== 39500000) params.set('max',state.max);
    if (state.stock) params.set('stock','1');
    for (const key of ['brand','category','age']) state[key].forEach(value => params.append(key,value));
    if (state.sort !== 'newest') params.set('sort',state.sort);
    if (state.type) params.set('type',state.type);
    const query = params.toString();
    try { history.replaceState(null,'',location.pathname+(query?'?'+query:'')); } catch { /* restricted local file origins */ }
  }
  function syncForm() {
    $('#price-min').value = state.min;
    $('#price-max').value = state.max;
    $('#range-min').value = state.min;
    $('#range-max').value = state.max;
    form.elements.stock.checked = state.stock;
    for (const name of ['brand','category','age']) $$(`input[name="${name}"]`,form).forEach(input=>{input.checked=state[name].map(String).includes(input.value);});
    $('.search input').value = state.query;
    $('.filter-error').textContent = '';
    $$('.archive-category').forEach(el=>el.classList.toggle('active',state.category.includes(el.dataset.category)));
  }
  function renderArchive() {
    const q = state.query.replace(/ي/g,'ی').replace(/ك/g,'ک').toLocaleLowerCase('fa').trim();
    visibleProducts = products.filter(product =>
      product.price >= state.min && product.price <= state.max &&
      (!state.stock || product.stock) &&
      (!state.brand.length || state.brand.includes(product.brand)) &&
      (!state.category.length || state.category.includes(product.category)) &&
      (!state.age.length || state.age.some(age => product.age && product.age >= age)) &&
      (!state.type || !product.pieces) &&
      (!q || product.name.replace(/ي/g,'ی').replace(/ك/g,'ک').toLocaleLowerCase('fa').includes(q))
    );
    if (state.sort === 'price-asc') visibleProducts.sort((a,b)=>a.price-b.price);
    if (state.sort === 'price-desc') visibleProducts.sort((a,b)=>b.price-a.price);
    if (state.sort === 'stock') visibleProducts.sort((a,b)=>Number(b.stock)-Number(a.stock));
    const pages = Math.max(1,Math.ceil(visibleProducts.length/pageSize));
    page = Math.min(page,pages);
    const start = (page-1)*pageSize;
    const slice = visibleProducts.slice(start,start+pageSize);
    $('#archive-grid').innerHTML = slice.length ? slice.map(p=>productCard(p)).join('') : '<div class="empty-state"><h2>محصولی پیدا نشد</h2><p>فیلترها یا عبارت جستجو را تغییر دهید.</p><button data-clear-filters>پاک کردن همه فیلترها</button></div>';
    $('.result-count').textContent = slice.length ? `نمایش ${fa(start+1)}–${fa(start+slice.length)} از ${fa(visibleProducts.length)} نتیجه` : '۰ نتیجه';
    $$('.sort-options button').forEach(button => {
      const active = button.dataset.sort === state.sort;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    });
    $('.mobile-sort select').value = state.sort;
    $('.pagination').innerHTML = pages > 1 ? Array.from({length:pages},(_,index)=>`<button data-page="${index+1}" ${page===index+1?'class="active" aria-current="page"':''} aria-label="صفحه ${fa(index+1)}">${fa(index+1)}</button>`).join('') : '';
    const labels = [];
    if (state.query) labels.push(`جستجو: ${state.query}`);
    if (state.min || state.max !== 39500000) labels.push(`${fa(state.min)} تا ${fa(state.max)} تومان`);
    if (state.stock) labels.push('فقط موجود');
    labels.push(...state.category.map(value=>categoryNames[value]||value));
    labels.push(...state.brand.map(value=>value==='bt'?'BT':'سایر برندها'));
    labels.push(...state.age.map(age=>`${fa(age)} سال به بالا`));
    if (state.type) labels.push('فیگورها');
    $('.active-filters').innerHTML = labels.map(label=>`<span class="filter-chip">${escapeHTML(label)}</span>`).join('')+(labels.length?'<button class="clear-filter" data-clear-filters>پاک کردن ×</button>':'');
    tick();
  }
  function closeFilters() {
    const wasOpen = $('.filter-panel')?.classList.contains('open');
    $('.filter-panel')?.classList.remove('open');
    $('.filter-panel-backdrop')?.classList.remove('visible');
    $('.mobile-filter-button')?.setAttribute('aria-expanded','false');
    document.body.classList.remove('filter-panel-open');
    if (wasOpen) $('.mobile-filter-button')?.focus();
  }
  function clearFilters() {
    if (!form) return;
    state = defaultState();page=1;
    syncForm();writeURL();renderArchive();
  }
  if (form) {
    const shownCategories = [
      {id:'ninja',name:'لگو لاک‌پشت‌های نینجا',image:'logo'},
      categories.find(c=>c.id==='minecraft'),
      {id:'batman',name:'لگو بتمن',image:'logo'},
      categories.find(c=>c.id==='ninja'),
      {id:'rings',name:'لگو ارباب حلقه‌ها',image:'logo'},
      categories.find(c=>c.id==='harry'),
      categories.find(c=>c.id==='starwars'),
      categories.find(c=>c.id==='city')
    ];
    $('#archive-categories').innerHTML = shownCategories.map(category=>`<button class="archive-category ${category.image==='logo'?'logo-category':''}" data-category="${category.id}"><img src="${category.original ? original(category.original) : img(category.image)}" alt="" width="70" height="70"><span>${category.name}</span></button>`).join('');
    readURL();syncForm();renderArchive();
    form.addEventListener('submit',event=>{
      event.preventDefault();
      const data = new FormData(form);
      const min = Number(data.get('min')), max = Number(data.get('max'));
      if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max > 39500000 || min > max) {
        $('.filter-error').textContent = 'حداقل قیمت باید از حداکثر قیمت کمتر یا برابر باشد.';
        return;
      }
      state.min=min;state.max=max;state.stock=data.has('stock');
      state.brand=data.getAll('brand');state.age=data.getAll('age').map(Number);
      const formCategoryIds = $$('input[name="category"]',form).map(input=>input.value);
      state.category=[...state.category.filter(value=>!formCategoryIds.includes(value)),...data.getAll('category')];
      page=1;syncForm();writeURL();renderArchive();closeFilters();
      toast('فیلترها اعمال شد.');
    });
    for (const end of ['min','max']) {
      $(`#range-${end}`).addEventListener('input',()=>{
        let value=Number($(`#range-${end}`).value);
        value=end==='min'?Math.min(value,Number($('#price-max').value)):Math.max(value,Number($('#price-min').value));
        $(`#range-${end}`).value=value;$(`#price-${end}`).value=value;
      });
      $(`#price-${end}`).addEventListener('input',()=>{$(`#range-${end}`).value=$(`#price-${end}`).value;});
    }
    $('.search').addEventListener('submit',event=>{
      event.preventDefault();state.query=$('.search input').value.trim();page=1;writeURL();renderArchive();
      setSearch(false);
    });
    $('.mobile-sort select').addEventListener('change',event=>{
      state.sort=event.target.value;page=1;writeURL();renderArchive();
    });
    $('.mobile-filter-button').addEventListener('click',()=>{
      setMenu(false);setSearch(false);
      $('.filter-panel').classList.add('open');$('.filter-panel-backdrop').classList.add('visible');
      document.body.classList.add('filter-panel-open');
      $('.mobile-filter-button').setAttribute('aria-expanded','true');$('.close-filters').focus();
    });
    $('.close-filters').addEventListener('click',closeFilters);
    $('.filter-panel-backdrop').addEventListener('click',closeFilters);
    window.addEventListener('popstate',()=>{readURL();syncForm();page=1;renderArchive();});
  }

  document.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if (!button) return;
    if (button.dataset.add) addToCart(button.dataset.add);
    if (button.hasAttribute('data-open-cart')) {renderCart();showDialog($('.cart-dialog'));}
    if (button.dataset.quick) quickView(button.dataset.quick);
    if (button.dataset.quantity) {
      const row=cart.find(row=>row.id===Number(button.dataset.quantity));
      if (row) row.quantity=Math.min(99,row.quantity+Number(button.dataset.delta));
      cart=cart.filter(row=>row.quantity>0);renderCart();
    }
    if (button.dataset.remove) {cart=cart.filter(row=>row.id!==Number(button.dataset.remove));renderCart();}
    if (button.classList.contains('close-dialog')) button.closest('dialog').close();
    if (button.hasAttribute('data-scroll-top')) window.scrollTo({top:0,behavior:'smooth'});
    if (button.hasAttribute('data-open-favorites')) showFavorites();
    if (button.dataset.favorite) {
      const id=Number(button.dataset.favorite);
      favorites=favorites.includes(id)?favorites.filter(value=>value!==id):[...favorites,id];
      saveStorage('famito-html-favorites-v1',favorites);
      button.textContent=favorites.includes(id)?'حذف از علاقه‌مندی‌ها':'افزودن به علاقه‌مندی‌ها';
      button.setAttribute('aria-pressed',String(favorites.includes(id)));
      toast(favorites.includes(id)?'محصول ذخیره شد.':'محصول از علاقه‌مندی‌ها حذف شد.');
      if (button.closest('.favorites-list')) showFavorites();
    }
    if (button.dataset.compare) {
      const id=Number(button.dataset.compare);
      if (compare.includes(id)) return toast('این محصول در فهرست مقایسه است.');
      if (compare.length>=3) return toast('حداکثر سه محصول قابل مقایسه است.');
      compare.push(id);toast('محصول به مقایسه اضافه شد.');
    }
    if (button.dataset.uncompare) {compare=compare.filter(id=>id!==Number(button.dataset.uncompare));showCompare();}
    if (button.dataset.info) {
      const messages={
        account:['حساب کاربری','این مرحله، بازسازی HTML صفحه اصلی و آرشیو است. ورود و حساب کاربری در مرحله اتصال به وردپرس فعال می‌شود.'],
        terms:['قوانین و مقررات','محتوای قوانین فروشگاه در ویدیو مشخص نیست و در این پیش‌نمایش درج نشده است.'],
        social:['شبکه‌های اجتماعی','آدرس شبکه‌های اجتماعی در فایل‌های مرجع مشخص نیست. لینک نهایی در مرحله بعد اضافه می‌شود.']
      };
      if (button.dataset.info==='compare') showCompare();
      else {const message=messages[button.dataset.info];if(message)info(message[0],`<p>${message[1]}</p>`);}
    }
    if (button.dataset.carousel) {
      const track=document.getElementById(button.dataset.carousel);
      track.scrollBy({left:Number(button.dataset.direction)*(track.firstElementChild.getBoundingClientRect().width+14),behavior:'smooth'});
    }
    if (button.hasAttribute('data-clear-filters')) clearFilters();
    if (button.dataset.category && state) {
      state.category=state.category.length===1&&state.category[0]===button.dataset.category?[]:[button.dataset.category];
      state.type='';page=1;syncForm();writeURL();renderArchive();
    }
    if (button.dataset.sort && state) {
      if (['popular','rating','bestselling'].includes(button.dataset.sort)) return toast('مرتب‌سازی محبوبیت، امتیاز و فروش به داده‌های واقعی فروشگاه نیاز دارد.');
      state.sort=button.dataset.sort;page=1;writeURL();renderArchive();
    }
    if (button.dataset.page && state) {
      page=Number(button.dataset.page);renderArchive();$('.archive-products').scrollIntoView({behavior:'smooth',block:'start'});
    }
  });
  function setMenu(open) {
    $('.site-header').classList.toggle('menu-open',open);
    $$('[data-open-menu]').forEach(button=>button.setAttribute('aria-expanded',String(open)));
    if (open) setSearch(false);
  }
  function setSearch(open) {
    $('.site-header').classList.toggle('search-open',open);
    $('.search-toggle').setAttribute('aria-expanded',String(open));
    if (open) {setMenu(false);$('.search input').focus();}
  }
  $$('[data-open-menu]').forEach(button=>button.addEventListener('click',()=>setMenu(!$('.site-header').classList.contains('menu-open'))));
  $('.search-toggle').addEventListener('click',()=>setSearch(!$('.site-header').classList.contains('search-open')));
  $$('.main-nav a').forEach(link=>link.addEventListener('click',()=>setMenu(false)));
  if (document.body.classList.contains('home-page')) $('[data-dock-home]').setAttribute('aria-current','page');
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'){closeFilters();setMenu(false);setSearch(false);}
    if(event.key==='Tab' && $('.filter-panel')?.classList.contains('open')) {
      const focusable = $$('button,input,summary,select,a[href]',$('.filter-panel')).filter(element=>element.getClientRects().length && !element.disabled);
      const first=focusable[0],last=focusable[focusable.length-1];
      if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  const mobileQuery=window.matchMedia('(max-width: 680px)');
  mobileQuery.addEventListener('change',()=>{closeFilters();setMenu(false);setSearch(false);});
  if ($('.review-track')) {
    for (const [selector,direction] of [['.review-next',-1],['.review-prev',1]]) {
      $(selector).addEventListener('click',()=>{
        const track=$('.review-track');
        track.scrollBy({left:direction*(track.firstElementChild.getBoundingClientRect().width+15),behavior:'smooth'});
      });
    }
  }
  const batman=$('.batman-video');
  if (batman && 'IntersectionObserver' in window) {
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    let inView=false;
    const updateVideo=()=>{
      if (!inView || motion.matches || document.hidden) {batman.pause();return;}
      const source=$('source',batman);
      if (!source.src) {source.src=source.dataset.src;batman.load();}
      batman.play().catch(()=>{});
    };
    const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;updateVideo();},{threshold:.15});
    observer.observe(batman);
    motion.addEventListener('change',updateVideo);
    document.addEventListener('visibilitychange',updateVideo);
  }
  $$('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{
    if (event.target!==dialog) return;
    const rect=dialog.getBoundingClientRect();
    if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();
  }));
  // Visual countdown fixture: one continuous client deadline, never changes product prices.
  function tick() {
    const left=Math.max(0,Math.floor((deadline-Date.now())/1000));
    const values=[Math.floor(left/86400),Math.floor(left/3600)%24,Math.floor(left/60)%60,left%60];
    const text=values.map(value=>String(value).padStart(2,'0').replace(/\d/g,digit=>'۰۱۲۳۴۵۶۷۸۹'[digit])).join(' : ');
    $$('[data-countdown]').forEach(el=>{el.textContent=text;});
  }
  renderCart();tick();setInterval(tick,1000);
})();
