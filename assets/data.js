/* Visible reference products. Prices are the values shown in the recording,
   not live inventory. Categories and stock support the standalone UI demo.
   Optional fields used by product.html:
     altImage - second photo, shown on card hover and in the gallery
     gallery  - extra high-resolution frames from assets/originals/ */
window.LEGO_PRODUCTS = [
  {id:1,name:'لگو هری پاتر کوچه دیاگون ۵۶۸۶ قطعه کد NO.H66015',image:'product-0',price:36900000,pieces:5686,age:16,figures:15,category:'harry',brand:'other',stock:true},
  {id:2,name:'لگو قلعه هاگوارتز ۶۰۲۰ قطعه کد NO.70068',image:'product-1',price:32870000,oldPrice:32880000,pieces:6020,age:6,figures:4,category:'harry',brand:'other',stock:true,sale:true},
  {id:3,name:'لگو برج سیاه بارادور ۵۴۷۱ قطعه کد NO.66333',image:'product-2',altImage:'product-2-alt',price:33000000,pieces:5471,age:18,figures:12,category:'rings',brand:'other',stock:true},
  {id:4,name:'لگو برج هری پاتر ۴۸۰۳ قطعه کد NO.88025',image:'product-3',gallery:[{file:'hp-galleon.webp',alt:'لگو برج هری پاتر، نمای کامل سازه',width:800,height:800}],price:29480000,pieces:4803,age:18,figures:16,category:'harry',brand:'other',stock:true},
  {id:5,name:'لگو غار بتمن ۳۹۸۱ قطعه کد NO.87085',image:'product-4',altImage:'product-4-alt',price:29000000,pieces:3981,age:18,figures:3,category:'batman',brand:'other',stock:true},
  {id:6,name:'لگو استاروارز سفینه امپراطوری ۵۳۷۴ قطعه کد NO.85676',image:'product-5',gallery:[{file:'3.webp',alt:'لگو سفینه استاروارز، نمای کامل',width:800,height:800}],price:22990000,pieces:5374,age:18,figures:2,category:'starwars',brand:'other',stock:true},
  {id:7,name:'لگو سوپرمارکت سیمپسون ۲۱۷۹ قطعه کد NO.DP016',image:'product-6',price:21980000,pieces:2179,age:12,figures:6,category:'city',brand:'other',stock:true},
  {id:8,name:'لگو بتمن تابلو گاتهام ۴۲۱۰ قطعه کد NO.MY976',image:'product-7',price:20800000,pieces:4210,age:18,figures:2,category:'batman',brand:'other',stock:true},
  {id:9,name:'لگو لاک‌پشت نینجا ۸۹۰ قطعه کد NO.10728',image:'product-8',price:6598000,pieces:890,age:6,figures:6,category:'ninja',brand:'other',stock:true},
  {id:10,name:'لگو استاروارز ۱۰۵۰ قطعه کد NO.50079',image:'product-9',price:6500000,pieces:1050,age:10,figures:2,category:'starwars',brand:'other',stock:true},
  {id:11,name:'لگو هری پاتر میدان گریمولد ۱۰۸۳ قطعه کد NO.6071',image:'product-10',price:6498000,pieces:1083,age:18,figures:9,category:'harry',brand:'other',stock:true},
  {id:12,name:'لگو کشتی مروارید سیاه ۸۰۴ قطعه کد NO.18016',image:'product-11',price:6280000,pieces:804,age:14,figures:6,category:'rings',brand:'other',stock:true},
  {id:13,name:'لگو هن سولو کد BT-9048',image:'han',price:80000,oldPrice:90000,category:'starwars',brand:'bt',stock:true,sale:true},
  {id:14,name:'لگو ماینکرافت کریپر کد BT-9040',image:'creeper',price:90000,category:'minecraft',brand:'bt',stock:true},
  {id:15,name:'لگو شخصیت هری پاتر لرد ولدمورت کد BT9033',image:'voldemort',price:90000,category:'harry',brand:'bt',stock:true},
  {id:16,name:'لگو صدف ۱۸۰۸ قطعه کد NO.11808',image:'shell',price:10300000,oldPrice:10600000,pieces:1808,age:14,figures:5,category:'flowers',brand:'other',stock:true,sale:true},
  {id:17,name:'لگو ۱۰ مدل جنگی طوسی کد BT 5025',image:'military',price:868000,category:'vehicles',brand:'bt',stock:true},
  {id:18,name:'لگو ساختمان مغازه امپوریوم ۲۱۸۲ قطعه کد NO.JAF124',image:'shop',gallery:[{file:'cafe-with-lights.webp',alt:'ساختمان و کافه لگویی با نورپردازی',width:800,height:800}],price:15980000,pieces:2182,age:16,figures:6,category:'city',brand:'other',stock:true},
  {id:19,name:'لگو ۱۲ شخصیت ماینکرافت طلایی کد NO.33102',image:'minecraft',price:998000,category:'minecraft',brand:'other',stock:true},
  {id:20,name:'لگو ۱۰ مدل موتور کد BT750',image:'bike',price:868000,category:'vehicles',brand:'bt',stock:true}
];
window.LEGO_CATEGORIES = [
  {id:'starwars',name:'لگوی جنگ ستارگان',image:'category-6',original:'star-wars.webp'},
  {id:'ninja',name:'لگوی نینجا',image:'category-5',original:'ninja-lego.webp'},
  {id:'harry',name:'لگوی هری پاتر',image:'category-4',original:'harry-potter.webp',mobile:'harry-mob.webp'},
  {id:'minecraft',name:'لگوی ماینکرافت',image:'category-3',original:'minecraft.webp'},
  {id:'flowers',name:'لگوی گل‌ها',image:'category-2',original:'flowers.webp'},
  {id:'city',name:'لگوی سیتی',image:'category-1',original:'city.webp'},
  {id:'friends',name:'لگوی فرندز',image:'category-0',original:'friends.webp'}
];
