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
  /* Keep every button bound to one product in sync, whichever view it lives in
     (card, quick view dialog, favorites list or the single product page). */
  function labelFavorite(id,on) {
    $$(`[data-favorite="${id}"]`).forEach(button=>{
      button.setAttribute('aria-pressed',String(on));
      if (button.classList.contains('icon-only')) {
        button.setAttribute('aria-label',on?'حذف از علاقه‌مندی‌ها':'افزودن به علاقه‌مندی‌ها');
        button.setAttribute('title',on?'در علاقه‌مندی‌ها':'افزودن به علاقه‌مندی‌ها');
      } else {
        button.textContent=on?'حذف از علاقه‌مندی‌ها':'افزودن به علاقه‌مندی‌ها';
      }
    });
  }
  function labelCompare(id,on) {
    $$(`[data-compare="${id}"]`).forEach(button=>{
      button.setAttribute('aria-pressed',String(on));
      if (button.classList.contains('icon-only')) button.setAttribute('title',on?'در فهرست مقایسه':'افزودن به مقایسه');
    });
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
    const similar = mode === 'similar';
    const discount = product.oldPrice ? Math.round((1-product.price/product.oldPrice)*100) : 0;
    let offer = '';
    if (deal) offer = `<div class="offer-line">${discount > 0 ? `<span class="discount-badge">${fa(discount)}٪</span>` : ''}<span class="countdown" data-countdown>۰۰ : ۰۴ : ۳۰ : ۰۰</span></div>`;
    else if (mode === 'archive') offer = `<div class="offer-line ${product.sale ? '' : 'placeholder'}"><span>پیشنهاد ویژه :</span><span class="countdown" data-countdown>۰۰:۰۴:۳۰:۰۰</span></div>`;
    const photo = (open, close) => `${open}<img class="primary" src="${img(product.image)}" alt="${escapeHTML(product.name)}" loading="lazy" width="236" height="222">
      ${product.altImage ? `<img class="secondary" src="${img(product.altImage)}" alt="بسته‌بندی ${escapeHTML(product.name)}" loading="lazy" width="236" height="222">` : ''}${close}`;
    const photoTag = similar
      ? photo(`<a class="product-photo ${product.altImage ? 'has-alt' : ''}" href="product.html?id=${product.id}" aria-label="دیدن ${escapeHTML(product.name)}">`, '</a>')
      : photo(`<button class="product-photo ${product.altImage ? 'has-alt' : ''}" data-quick="${product.id}" aria-label="نمایش ${escapeHTML(product.name)}">`, '</button>');
    return `<article class="product-card ${deal ? 'deal-card' : ''}${similar ? ' similar-card' : ''}${product.stock ? '' : ' out'}" data-product-id="${product.id}">
      ${similar && !product.stock ? '<span class="oos-badge">ناموجود</span>' : ''}${offer}${photoTag}
      ${mode === 'archive' ? specs(product) : ''}
      <h3 class="card-title"><a href="product.html?id=${product.id}">${escapeHTML(product.name)}</a></h3>
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
  function addToCart(id, quantity = 1) {
    const product = findProduct(id);
    if (!product) return;
    const wanted = Math.max(1,Math.min(99,Number(quantity) || 1));
    const row = cart.find(item => item.id === product.id);
    if ((row ? row.quantity : 0)+wanted > 99) return toast('حداکثر تعداد نمایشی هر محصول ۹۹ عدد است.');
    if (row) row.quantity += wanted; else cart.push({id:product.id,quantity:wanted});
    renderCart();
    toast('محصول به سبد خرید اضافه شد.');
  }
  function quickView(id) {
    const product = findProduct(id);
    if (!product) return;
    $('.quick-content').innerHTML = `<img src="${img(product.image)}" alt="${escapeHTML(product.name)}"><div><h3>${escapeHTML(product.name)}</h3>${specs(product)}${price(product)}<button class="add-to-cart" data-add="${product.id}">${icon('cart')}افزودن به سبد خرید</button><button class="quick-favorite" data-favorite="${product.id}" aria-pressed="${favorites.includes(product.id)}">${favorites.includes(product.id) ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}</button><br><button class="quick-favorite" data-compare="${product.id}">افزودن به مقایسه</button><a class="quick-page-link" href="product.html?id=${product.id}">مشاهده صفحه کامل محصول<span aria-hidden="true">‹</span></a></div>`;
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
    if (button.dataset.add) {
      const field = button.dataset.qty ? document.getElementById(button.dataset.qty) : null;
      addToCart(button.dataset.add, field ? field.value : 1);
    }
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
      const on=!favorites.includes(id);
      favorites=on?[...favorites,id]:favorites.filter(value=>value!==id);
      saveStorage('famito-html-favorites-v1',favorites);
      labelFavorite(id,on);
      toast(on?'محصول ذخیره شد.':'محصول از علاقه‌مندی‌ها حذف شد.');
      if (button.closest('.favorites-list')) showFavorites();
    }
    if (button.dataset.compare) {
      const id=Number(button.dataset.compare);
      if (compare.includes(id)) return toast('این محصول در فهرست مقایسه است.');
      if (compare.length>=3) return toast('حداکثر سه محصول قابل مقایسه است.');
      compare.push(id);labelCompare(id,true);toast('محصول به مقایسه اضافه شد.');
    }
    if (button.dataset.uncompare) {compare=compare.filter(id=>id!==Number(button.dataset.uncompare));showCompare();}
    if (button.dataset.info) {
      const messages={
        account:['حساب کاربری','این مرحله، بازسازی HTML صفحه اصلی و آرشیو است. ورود و حساب کاربری در مرحله اتصال به وردپرس فعال می‌شود.'],
        terms:['قوانین و مقررات','محتوای قوانین فروشگاه در ویدیو مشخص نیست و در این پیش‌نمایش درج نشده است.'],
        social:['شبکه‌های اجتماعی','آدرس شبکه‌های اجتماعی در فایل‌های مرجع مشخص نیست. لینک نهایی در مرحله بعد اضافه می‌شود.'],
        reviews:['نظرات کاربران','ثبت نظر و امتیاز کاربران به اتصال به وردپرس و ووکامرس نیاز دارد؛ در این پیش‌نمایش HTML فعال نیست.'],
        share:['اشتراک‌گذاری','لینک همین صفحه را می‌توانید از نوار نشانی مرورگر کپی کنید. دکمه‌های اشتراک شبکه‌ها پس از مشخص شدن آدرس آن‌ها اضافه می‌شوند.'],
        ask:['پرسش درباره محصول','پرسش و پاسخ کاربران به حساب کاربری و ووکامرس متصل نیست؛ در این پیش‌نمایش فقط چیدمان آن بازسازی شده است.'],
        pricematch:['اعلام قیمت مناسب‌تر','ثبت قیمت پیشنهادی به حساب کاربری و تایید فروشگاه نیاز دارد و در این پیش‌نمایش فعال نیست.']
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
  /* ------------------------------------------------------------------
     Single product page (product.html?id=N) — layout v2.2
     Modelled on the reference screenshot of the live WooCommerce page:
     three columns (gallery + rail / info / sticky buy box), four card
     tabs, grouped spec table, review + question empty states and a
     "similar products" grid.
     ------------------------------------------------------------------ */
  const singleRoot = $('#single-product');
  if (singleRoot) {
    const crumb = $('#breadcrumb');
    const missingBox = $('#product-missing');
    const lightbox = $('.lightbox-dialog');
    const pageCategories = Object.fromEntries([...categories.map(category=>[category.id,category.name]),
      ['batman','لگو بتمن'],['vehicles','لگو وسایل نقلیه'],['rings','لگو ارباب حلقه‌ها'],
      ['ninja','لگو لاک‌پشت نینجا'],['flowers','لگو گل‌ها'],['minecraft','لگو ماینکرافت'],['sets','لگو مجموعه و تم']]);
    const brandOf = product => product.brand === 'bt' ? 'BT' : 'سایر برندها';
    const skuOf = product => {
      const found = /کد\s*([A-Za-z0-9][A-Za-z0-9.\-]*)/.exec(product.name);
      return found ? found[1] : '';
    };
    const categoryList = product => product.categories || [product.category];
    const categoryName = id => pageCategories[id] || id;
    /* Parent categories of the live shop (like «لگو مجموعه و تم») have no filter
       in this dataset; link them to the whole archive instead of an empty one. */
    const categoryHref = id => products.some(item=>item.category === id) ? `archive.html?category=${id}` : 'archive.html';
    const galleryOf = product => {
      const frames = [{src:img(product.image),alt:product.name,width:236,height:222}];
      if (product.altImage) frames.push({src:img(product.altImage),alt:`بسته‌بندی ${product.name}`,width:232,height:219});
      (product.gallery || []).forEach(entry=>frames.push({src:original(entry.file),alt:entry.alt || product.name,width:entry.width || 800,height:entry.height || 800}));
      return frames;
    };
    const boolCell = value => value === true
      ? '<span class="pd-bool pd-bool-yes" aria-label="بله">'+icon('check')+'</span>'
      : value === false
        ? '<span class="pd-bool pd-bool-no" aria-label="خیر">'+icon('close')+'</span>'
        : '';
    let gallery = [];

    function describe(product,categoryLabel,sku) {
      return [
        `«${product.name}» از مجموعه محصولات ${categoryLabel} فروشگاه فمیتو لگو است.`,
        product.pieces
          ? `این مجموعه از ${fa(product.pieces)} قطعه ساخته می‌شود${product.figures ? ` و ${fa(product.figures)} فیگور اختصاصی دارد` : ''}${product.age ? ` و برای رده سنی ${fa(product.age)} سال به بالا مناسب است` : ''}. چیدن قطعه‌ها برای نوجوانان و بزرگ‌سالانی که به سازه‌های پرجزئیات علاقه دارند انتخاب مناسبی است.`
          : 'این محصول یک فیگور کلکسیونی است و برای کامل کردن مجموعه‌های نمایشی و چیدمان ویترینی به کار می‌رود.',
        'قطعات از پلاستیک ABS ساخته شده‌اند و با قطعه‌های هم‌اندازه مجموعه‌های ساختنی دیگر جور می‌شوند.',
        sku ? `کد ثبت‌شده این محصول در فروشگاه ${sku} است.` : ''
      ].filter(Boolean).join(' ');
    }
    function featureChips(product) {
      const chips = [];
      if (product.pieces) chips.push(['brick',`تعداد قطعات : ${fa(product.pieces)}`]);
      if (product.age) chips.push(['age',`رده سنی : ${fa(product.age)}+`]);
      chips.push(['material','جنس : پلاستیک']);
      if (product.figures) chips.push(['figure',`تعداد مینی فیگور : ${fa(product.figures)}`]);
      return `<p class="pd-feat-label">ویژگی های اصلی :</p><div class="pd-feats">${chips.map(([name,text])=>`<div class="pd-feat">${icon(name)}<span>${text}</span></div>`).join('')}</div>`;
    }
    function buyRows(product) {
      const rows = [
        product.stock ? ['shield','در انبار موجود است','ok'] : ['close','در انبار موجود نیست',''],
        ['medal','گارانتی: سلامت فیزیکی',''],
        ['truck','ارسال رایگان',''],
        product.stock ? ['box','آماده ارسال','ok'] : ['box','آماده ارسال نیست',''],
      ];
      if (product.updated) rows.push(['calendar',`تاریخ بروزرسانی : ${product.updated}`,'']);
      return `<ul class="pd-rows">${rows.map(([name,text,kind])=>`<li class="${kind}">${icon(name)}<span>${text}</span></li>`).join('')}</ul>`;
    }
    function specGroups(product,categoryLabel) {
      const groups = [];
      const main = [];
      if (product.age) main.push(['رده سنی',`${fa(product.age)}+`]);
      if ('movable' in product) main.push(['قابلیت حرکت',boolCell(product.movable),true]);
      if (product.pieces) main.push(['تعداد قطعات',fa(product.pieces)]);
      if ('box' in product) main.push(['جعبه',boolCell(product.box),true]);
      if (product.figures) main.push(['تعداد مینی فیگور',fa(product.figures)]);
      if (main.length) groups.push(['material','مشخصات کلی',main]);
      groups.push(['shield','مشخصات کیفیت',[['جنس','پلاستیک']]]);
      if (product.character) groups.push(['figure','مشخصات کاراکتر/حیوان',[
        ['نام کاراکتر',product.character],
        ...(product.figures ? [['تعداد مینی فیگور',fa(product.figures)]] : [])
      ]]);
      const other = [];
      if (product.weight) other.push(['وزن',product.weight]);
      if (product.dimensions) other.push(['ابعاد',product.dimensions]);
      if (skuOf(product)) other.push(['کد محصول',skuOf(product)]);
      other.push(['برند',brandOf(product)],['دسته‌بندی',categoryLabel],['قیمت',`${fa(product.price)} تومان`]);
      groups.push(['sale','سایر مشخصات',other]);
      return `<div class="pd-panelbox">${groups.map(([iconName,title,rows])=>`
        <h3 class="pd-group-title">${icon(iconName)}${title}</h3>
        <table class="pd-spec-table"><tbody>${rows.map(([label,value,raw])=>`<tr><th scope="row">${escapeHTML(label)}</th><td>${raw ? value : escapeHTML(value)}</td></tr>`).join('')}</tbody></table>`).join('')}</div>`;
    }
    function reviewsPanel() {
      return `<div class="pd-reviews">
        <div class="pd-reviews-head"><h3>دیدگاه کاربران</h3><span>دیدگاه‌ها ${fa(0)}</span></div>
        <div class="pd-rating-box">
          <div class="pd-rating-score"><strong>${fa(0)}٫${fa(0)}</strong><span>بر اساس ${fa(0)} دیدگاه</span></div>
          <div class="pd-rating-bars">${[5,4,3,2,1].map(star=>`<div class="pd-bar-row"><span>${fa(star)}</span><i style="--w:0%"></i></div>`).join('')}</div>
        </div>
        <p class="pd-reviews-empty">هیچ دیدگاهی برای این محصول نوشته نشده است.</p>
        <label class="sr-only" for="pd-review-input">متن دیدگاه شما</label>
        <textarea id="pd-review-input" rows="3" placeholder="نظر خود را در مورد این محصول بنویسید ..." disabled></textarea>
        <button class="pd-review-button" data-info="reviews">افزودن دیدگاه</button>
        <p class="demo-note">دیدگاه، امتیاز و پرسش کاربران به حساب کاربری و ووکامرس متصل نیست؛ در این پیش‌نمایش HTML فقط چیدمان واقعی آن‌ها بازسازی شده است.</p>
      </div>`;
    }
    function questionsPanel() {
      return `<div class="pd-questions">
        <h3 class="pd-group-title">${icon('headset')}پرسش و پاسخ</h3>
        <p class="pd-reviews-empty">هنوز پرسشی ثبت نشده است.</p>
        <p class="pd-questions-lead">شما هم درباره این کالا پرسش ثبت کنید</p>
        <button class="pd-review-button" data-info="ask">ثبت پرسش جدید</button>
      </div>`;
    }
    function renderProduct(product) {
      gallery = galleryOf(product);
      const sku = skuOf(product);
      const catIds = categoryList(product);
      const cats = catIds.map(categoryName);
      const categoryLabel = cats[0];
      const isFavorite = favorites.includes(product.id);
      const inCompare = compare.includes(product.id);
      document.title = `${product.name} | فمیتو لگو`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content',`خرید ${product.name} از فروشگاه فمیتو لگو با قیمت ${fa(product.price)} تومان.`);
      crumb.innerHTML = `<a href="index.html">خانه</a><span class="sep" aria-hidden="true">‹</span><a href="archive.html">فروشگاه</a>${catIds.map((id,index)=>`<span class="sep" aria-hidden="true">‹</span><a href="${categoryHref(id)}">${escapeHTML(cats[index])}</a>`).join('')}<span class="sep" aria-hidden="true">‹</span><span aria-current="page">${escapeHTML(product.name)}</span>`;
      singleRoot.innerHTML = `
      <div class="pd-top">
        <div class="pd-gallery">
          <div class="pd-rail">
            <button type="button" class="pd-rail-btn" data-lightbox aria-label="نمایش بزرگ تصویر" title="نمایش بزرگ">${icon('expand')}</button>
            <button type="button" class="pd-rail-btn icon-only" data-favorite="${product.id}" aria-pressed="${isFavorite}" aria-label="${isFavorite ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}" title="علاقه‌مندی‌ها">${icon('heart')}</button>
            <button type="button" class="pd-rail-btn icon-only" data-compare="${product.id}" aria-pressed="${inCompare}" aria-label="افزودن به مقایسه" title="مقایسه">${icon('compare')}</button>
            <button type="button" class="pd-rail-btn" data-info="share" aria-label="اشتراک گذاری" title="اشتراک گذاری">${icon('share')}</button>
            <button type="button" class="pd-rail-btn" data-info="ask" aria-label="پرسش درباره محصول" title="پرسش درباره محصول">${icon('headset')}</button>
          </div>
          <div class="pd-gallery-main">
            <div class="pd-stage">${product.stock ? '' : '<span class="oos-badge">ناموجود</span>'}<img id="pd-image" src="${gallery[0].src}" alt="${escapeHTML(gallery[0].alt)}" width="${gallery[0].width}" height="${gallery[0].height}" fetchpriority="high"></div>
            ${gallery.length > 1 ? `<div class="pd-thumbs" role="group" aria-label="تصاویر ${escapeHTML(product.name)}">${gallery.map((frame,index)=>`<button type="button" data-thumb="${index}" aria-current="${index === 0}" aria-label="تصویر ${fa(index+1)} از ${fa(gallery.length)}"><img src="${frame.src}" alt="" width="${frame.width}" height="${frame.height}" loading="lazy"></button>`).join('')}</div>` : ''}
            ${gallery.every(frame=>frame.width < 600) ? '<p class="pd-photo-note">تصویر این محصول فریم استخراج‌شده از ویدیوی مرجع است؛ با جای‌گذاری عکس اصلی، همین گالری با کیفیت کامل نمایش داده می‌شود.</p>' : ''}
          </div>
        </div>
        <div class="pd-info">
          <h1 class="pd-name">${escapeHTML(product.name)}</h1>
          <p class="pd-cats">دسته : ${catIds.map((id,index)=>`<a href="${categoryHref(id)}">${escapeHTML(cats[index])}</a>`).join('، ')}</p>
          ${featureChips(product)}
        </div>
        <aside class="pd-buybox" aria-label="خرید محصول">
          ${buyRows(product)}
          <div class="pd-price">${fa(product.price)}<small>تومان</small></div>
          <div class="pd-qtyrow"><div class="pd-qty"><button type="button" data-step="1" aria-label="افزایش تعداد">+</button><input id="pd-qty" type="number" value="1" min="1" max="99" step="1" inputmode="numeric" aria-label="تعداد سفارش"><button type="button" data-step="-1" aria-label="کاهش تعداد">−</button></div><span>عدد</span></div>
          <button class="pd-add" data-add="${product.id}" data-qty="pd-qty" ${product.stock ? '' : 'disabled'}>${icon('basket')}افزودن به سبد خرید</button>
          <p class="pd-pricematch"><span>آیا قیمت مناسب‌تری سراغ دارید؟</span><span class="pd-pricematch-actions"><button type="button" data-info="pricematch">بلی</button><button type="button" data-info="pricematch">خیر</button></span></p>
        </aside>
      </div>
      <div class="pd-tabcards" role="tablist" aria-label="بخش‌های اطلاعات محصول">
        <button type="button" class="pd-tabcard" role="tab" id="pd-tab-specs" data-tab="specs" aria-controls="pd-panel-specs" aria-selected="true" tabindex="0">${icon('brick')}مشخصات کلی</button>
        <button type="button" class="pd-tabcard" role="tab" id="pd-tab-reviews" data-tab="reviews" aria-controls="pd-panel-reviews" aria-selected="false" tabindex="-1">${icon('headset')}نظرات کاربران</button>
        <button type="button" class="pd-tabcard" role="tab" id="pd-tab-questions" data-tab="questions" aria-controls="pd-panel-questions" aria-selected="false" tabindex="-1">${icon('figure')}سوالات کاربران</button>
        <button type="button" class="pd-tabcard" role="tab" id="pd-tab-review" data-tab="review" aria-controls="pd-panel-review" aria-selected="false" tabindex="-1">${icon('sale')}نقد و بررسی</button>
      </div>
      <div class="pd-panel" role="tabpanel" id="pd-panel-specs" data-panel="specs" aria-labelledby="pd-tab-specs" tabindex="0">${specGroups(product,categoryLabel)}</div>
      <div class="pd-panel" role="tabpanel" id="pd-panel-reviews" data-panel="reviews" aria-labelledby="pd-tab-reviews" tabindex="0" hidden>${reviewsPanel()}</div>
      <div class="pd-panel" role="tabpanel" id="pd-panel-questions" data-panel="questions" aria-labelledby="pd-tab-questions" tabindex="0" hidden>${questionsPanel()}</div>
      <div class="pd-panel" role="tabpanel" id="pd-panel-review" data-panel="review" aria-labelledby="pd-tab-review" tabindex="0" hidden><div class="pd-panelbox pd-prose"><p>${escapeHTML(describe(product,categoryLabel,sku))}</p><p class="demo-note">متن نقد و بررسی در این پیش‌نمایش از مشخصات ثبت‌شده همین محصول ساخته می‌شود؛ متن اصلی باید از ووکامرس خوانده شود.</p></div></div>
      <section class="pd-similar" aria-labelledby="pd-similar-title">
        <h2 class="pd-similar-title" id="pd-similar-title">${icon('compare')}محصولات مشابه</h2>
        <div class="pd-similar-grid" id="pd-similar-grid"></div>
      </section>`;
      selectTab('specs');
    }
    function selectImage(index) {
      const frame = gallery[index];
      if (!frame) return;
      const stage = $('#pd-image');
      stage.src = frame.src;
      stage.alt = frame.alt;
      stage.width = frame.width;
      stage.height = frame.height;
      $$('.pd-thumbs button').forEach((button,position)=>button.setAttribute('aria-current',String(position === index)));
    }
    function selectTab(key) {
      const tabs = $$('.pd-tabcard[role="tab"]');
      tabs.forEach(tab=>{
        const on = tab.dataset.tab === key;
        tab.setAttribute('aria-selected',String(on));
        tab.tabIndex = on ? 0 : -1;
      });
      $$('.pd-panel').forEach(panel=>{ panel.hidden = panel.dataset.panel !== key; });
    }
    function relatedTo(product) {
      const same = products.filter(item=>item.id !== product.id && item.category === product.category);
      const rest = products.filter(item=>item.id !== product.id && item.category !== product.category)
        .sort((a,b)=>Math.abs(a.price-product.price)-Math.abs(b.price-product.price));
      return [...same,...rest].slice(0,8);
    }
    singleRoot.addEventListener('click',event=>{
      const step = event.target.closest('[data-step]');
      if (step) {
        const field = $('#pd-qty');
        field.value = String(Math.min(99,Math.max(1,(parseInt(field.value,10) || 1)+Number(step.dataset.step))));
        return;
      }
      const thumb = event.target.closest('[data-thumb]');
      if (thumb) return selectImage(Number(thumb.dataset.thumb));
      const tab = event.target.closest('[role="tab"]');
      if (tab) selectTab(tab.dataset.tab);
      if (event.target.closest('[data-lightbox]')) {
        const stage = $('#pd-image');
        $('img',lightbox).src = stage.src;
        $('img',lightbox).alt = stage.alt;
        showDialog(lightbox);
      }
    });
    singleRoot.addEventListener('keydown',event=>{
      const tab = event.target.closest('[role="tab"]');
      if (!tab || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      const tabs = $$('.pd-tabcard[role="tab"]');
      const here = tabs.indexOf(tab);
      const move = {ArrowLeft:1,ArrowRight:-1}[event.key];
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length-1 : (here+move+tabs.length)%tabs.length;
      event.preventDefault();
      tabs[next].focus();
      selectTab(tabs[next].dataset.tab);
    });
    const requested = new URLSearchParams(location.search);
    const product = findProduct(requested.get('id') || requested.get('product') || 0);
    if (product) {
      missingBox.hidden = true;
      renderProduct(product);
      $('#pd-similar-grid').innerHTML = relatedTo(product).map(item=>productCard(item,'similar')).join('');
    } else {
      singleRoot.hidden = true;
      missingBox.hidden = false;
      crumb.innerHTML = `<a href="index.html">خانه</a><span class="sep" aria-hidden="true">‹</span><a href="archive.html">فروشگاه</a><span class="sep" aria-hidden="true">‹</span><span aria-current="page">محصول پیدا نشد</span>`;
      document.title = 'محصول پیدا نشد | فمیتو لگو';
      toast('محصول خواسته‌شده در داده‌های این بسته نیست.');
    }
  }

  renderCart();tick();setInterval(tick,1000);
})();
