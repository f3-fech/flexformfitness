import admin from 'firebase-admin';
import { initFirebase } from './utils.js';

// Initialize Firebase Admin
initFirebase(admin);
const db = admin.firestore();

const collectionSEOData = {
  'camisetas-oversize': {
    title: 'Camisetas Oversize Hombre',
    title_en: "Men's Oversized T-Shirts",
    description: `Explora la colección definitiva de <strong>camisetas oversized gym</strong>: patronaje <em>heavyweight</em> de alto gramaje, hombros caídos y el fit holgado perfecto para entrenar cómodo y con máximo estilo.`,
    description_en: `Explore the ultimate collection of <strong>oversized gym t-shirts</strong>: heavyweight premium fabrics, dropped shoulders, and the ideal relaxed fit engineered for maximum training comfort.`,
    detailedDescription: `<section class="seo-pillars">
  <div class="container">
    <h2>CAMISETAS OVERSIZED GYM: ESTILO CULTURISMO Y MÁXIMO CONFORT</h2>
    
    <p class="intro-text">
      Nuestra línea de <strong>camisetas oversized gym</strong> ha sido diseñada para quienes buscan la combinación ideal entre rendimiento, estética urbana y durabilidad. En el gimnasio, la ropa debe acompañar la intensidad de cada serie sin limitar el rango de movimiento; por eso, cada <strong>camiseta oversized gym</strong> de nuestro catálogo está confeccionada con patrones ergonómicos y tejidos de alta densidad que mantienen su caída estructurada repetición tras repetición.
    </p>

    <h3>Patronaje Heavyweight y Caída Perfecta</h3>
    <p>
      Utilizamos algodón premium de alto gramaje para lograr esa sensación sólida y robusta tan característica de la ropa de entrenamiento moderna. Estas <strong>camisetas gym oversized</strong> destacan por sus hombros caídos (<em>drop-shoulder</em>) y un corte amplio en la zona dorsal y del pecho, garantizando total libertad en ejercicios de empuje y tirón como press de banca, dominadas y remos pesados.
    </p>

    <h3>Diseñadas para el Culturismo y Heavy Lifting</h3>
    <p>
      Inspiradas en la cultura clásica del <em>bodybuilding</em> y los entrenamientos de alta exigencia, cada <strong>camiseta oversized para gym</strong> ofrece una ventilación óptima y una alta resistencia al sudor y al roce con barras o discos. Un estándar en <strong>ropa oversized gym</strong> pensado para soportar sesiones extremas sin deformarse ni perder su estructura original.
    </p>

    <h3>El Concepto Pump Cover: Calentamiento y Rendimiento</h3>
    <p>
      Utilizada habitualmente como <strong>camiseta pump cover</strong>, nuestra gama oversized te ayuda a retener el calor muscular durante las series iniciales y de aproximación. Su corte holgado permite mantener la temperatura en hombros y espalda, adaptándose tanto al rack de sentadillas como a tu estilo urbano diario fuera del gimnasio.
    </p>

    <h3>Guía de Tallas y Cuidado de tus Prendas</h3>
    <p>
      Nuestras <strong>camisetas oversized</strong> vienen con el corte holgado predefinido: si buscas el ajuste clásico oversize que cae por debajo de la cintura con hombros caídos, te recomendamos elegir tu <strong>talla habitual</strong>. Para preservar la suavidad de las fibras de algodón y la durabilidad de las prendas, lávalas del revés con agua fría (máximo 30 °C) y déjalas secar al aire evitando la secadora.
    </p>

    <h3>Resistencia y Estética Impecable</h3>
    <p>
      Las costuras reforzadas en cuello y hombros aseguran que tus prendas mantengan la estructura original tras múltiples lavados y sesiones de entrenamiento. Si buscas consolidar tu armario con piezas versátiles que luzcan tan bien en la calle como en el gimnasio, nuestra gama <strong>oversized gym</strong> es la elección definitiva.
    </p>
  </div>
</section>`,
    detailedDescription_en: `<section class="seo-pillars">
  <div class="container">
    <h2>OVERSIZED GYM T-SHIRTS: HEAVYWEIGHT FIT &amp; MAXIMUM FREEDOM</h2>
    
    <p class="intro-text">
      Our line of <strong>oversized gym t-shirts</strong> is engineered for lifters who refuse to compromise on style, comfort, or performance. During intense lifting sessions, your apparel needs to support full range of motion without distraction. Every <strong>oversized gym shirt</strong> in this collection is crafted with dropped shoulders and a heavy drape that maintains its bold structure work set after work set.
    </p>

    <h3>Heavyweight Fit &amp; Premium Drape</h3>
    <p>
      We utilize high-density premium cotton to deliver that iconic heavyweight feel. These <strong>oversized gym tees</strong> are built with extra room around the chest, shoulders, and lats, granting uncompromised mobility during presses, heavy rows, and barbell squats.
    </p>

    <h3>Built for Bodybuilding &amp; Strength Training</h3>
    <p>
      Drawing inspiration from classic bodybuilding culture, every <strong>oversized gym t-shirt</strong> combines targeted breathability with rugged durability. Engineered to handle barbell friction and intense sweat while keeping you cool and focused throughout your routine.
    </p>

    <h3>The Ultimate Pump Cover Essential</h3>
    <p>
      Serving as the ideal <strong>pump cover</strong>, these relaxed-fit tops help keep your muscle groups warm during initial warm-up sets. Keep it on for a stealthy heavyweight aesthetic or shed it when your pump peaks.
    </p>

    <h3>Sizing Advice &amp; Garment Care</h3>
    <p>
      Our <strong>oversized clothes for men</strong> are pre-cut for a true relaxed drape. We recommend ordering your <strong>standard size</strong> for the signature drop-shoulder look. To keep the cotton fibers plush and prevent shrinkage, machine wash cold inside out and air dry.
    </p>

    <h3>Long-Lasting Activewear Performance</h3>
    <p>
      Reinforced collars and fade-resistant dyes ensure your gear stays sharp wash after wash. Elevate your everyday training wardrobe with versatile <strong>oversized gym clothing</strong> designed to look as strong on the street as it performs inside the gym.
    </p>
  </div>
</section>`,
    seo: {
      title: 'Camisetas Oversized Gym Hombre | FLEX FORM FITNESS',
      description: 'Camisetas oversized gym de alto gramaje y corte caído. El ajuste heavyweight perfecto para culturismo, levantamiento de pesas y estilo urbano.',
      keywords: ['camisetas oversized', 'oversized gym', 'camisetas gym oversized', 'camiseta oversized para gym', 'ropa oversized gym']
    },
    seo_en: {
      title: "Men's Oversized Gym T-Shirts | FLEX FORM FITNESS",
      description: 'Heavyweight oversized gym t-shirts for men. Dropped shoulders, relaxed athletic drape, and bodybuilding pump cover style.',
      keywords: ['oversized t shirt', 'oversized gym t-shirts', 'oversized clothes for men', 'oversized gym shirt']
    }
  },

  'camisetas-sin-manga-y-tirantes-hombre': {
    title: 'Camisetas sin Manga y Tirantes Hombre',
    title_en: "Men's Tank Tops & Sleeveless Shirts",
    description: `Descubre la gama de <strong>camisetas de tirantes hombre</strong> y <strong>camisetas sin mangas</strong>: transpirabilidad extrema, corte atlético y máxima libertad de movimiento para entrenamientos de alta exigencia.`,
    description_en: `Discover our performance <strong>tank tops for men</strong> and <strong>sleeveless shirts for men</strong>: breathable cotton blends and athletic fits designed for uncompromised mobility.`,
    detailedDescription: `<section class="seo-pillars">
  <div class="container">
    <h2>CAMISETAS DE TIRANTES Y SIN MANGAS GYM: RENDIMIENTO Y DEFINICIÓN</h2>
    
    <p class="intro-text">
      Nuestra colección de <strong>camisetas tirante gym</strong> y <strong>camiseta sin mangas</strong> está pensada para atletas que exigen libertad absoluta en cada levantamiento. Ya sea en series pesadas de press militar o dominadas lastradas, cada <strong>camiseta de tirantes hombre</strong> ofrece un corte ergonómico que resalta la masa muscular mientras previene la acumulación de calor y sudor durante el entrenamiento.
    </p>

    <h3>Patronaje Ergonómico y Libertad de Movimiento</h3>
    <p>
      Los <strong>tirantes flexform</strong> han sido calibrados con sisas amplias y cortes en espalda diseñados para no rozar en ejercicios de hombro o dorsal. Su patronaje proporciona una movilidad ilimitada en cualquier ángulo de empuje o tracción, permitiendo visualizar la contracción muscular en cada repetición.
    </p>

    <h3>Tejidos Transpirables de Máxima Frescura</h3>
    <p>
      Confeccionadas con mezclas premium de algodón transpirable y elastano, cada <strong>camiseta de tirantes hombre</strong> absorbe la humedad y acelera su evaporación. El tejido mantiene un tacto ligero y suave sobre la piel, ideal para sesiones de alta sudoración y días calurosos.
    </p>

    <h3>Corte Stringer y Estilo Clásico de Culturismo</h3>
    <p>
      Tanto si prefieres un corte clásico de <strong>camiseta sin mangas</strong> con cobertura moderada como un diseño de <strong>camisetas tirante gym</strong> estilo stringer, nuestras prendas garantizan una silueta atlética que acentúa la forma de V del torso sin holguras excesivas.
    </p>

    <h3>Guía de Ajuste y Lavado</h3>
    <p>
      Elige tu <strong>talla habitual</strong> para un ajuste atlético que acompañe tu cuerpo de forma natural. Si prefieres un ajuste más ceñido a la musculatura, puedes seleccionar una talla inferior. Lava tus prendas deportivas en agua fría con colores similares para mantener la elasticidad y los colores intensos.
    </p>

    <h3>Durabilidad Comprobada en Cada Serie</h3>
    <p>
      Costuras planas reforzadas en cuello y tirantes evitan cualquier fricción molesta en contacto con la piel. Un estándar de resistencia diseñado para soportar entrenamientos continuos y lavados frecuentes manteniendo su elasticidad y caída original.
    </p>
  </div>
</section>`,
    detailedDescription_en: `<section class="seo-pillars">
  <div class="container">
    <h2>MEN'S GYM TANK TOPS &amp; SLEEVELESS SHIRTS: UNRESTRICTED TRAINING</h2>
    
    <p class="intro-text">
      Engineered for high-intensity lifting and maximum airflow, our collection of <strong>tank top for men</strong> and <strong>sleeveless shirt men</strong> delivers uncompromised range of motion. Each piece is designed to showcase muscular definition while keeping you cool and focused through every grueling set.
    </p>

    <h3>100% Premium Cotton &amp; Breathable Blends</h3>
    <p>
      Crafted with lightweight <strong>tank tops cotton</strong> fabrics that draw moisture away from your skin, providing superior comfort and continuous ventilation during intense bodybuilding workouts and conditioning sessions.
    </p>

    <h3>Athletic Cut for Full Shoulder Mobility</h3>
    <p>
      Featuring deep-cut armholes and a tapered back silhouette, these <strong>fit tank tops</strong> eliminate fabric bunching and underarm chafing during heavy bench presses, lateral raises, and overhead extensions.
    </p>

    <h3>Classic Stringer &amp; Muscle Tank Styles</h3>
    <p>
      Whether you prefer a traditional <strong>shirt sleeveless</strong> athletic cut with shoulder coverage or an open-back stringer, our designs accentuate upper-body proportions while giving you maximum agility.
    </p>

    <h3>Sizing &amp; Maintenance Recommendations</h3>
    <p>
      Select your <strong>regular size</strong> for an athletic taper that moves effortlessly with your physique. For a closer, body-contouring fit, size down. Machine wash cold inside out and air dry to maintain the premium fabric softness.
    </p>

    <h3>Rugged Durability &amp; Shape Retention</h3>
    <p>
      Flatlock reinforced stitching and high-tensile yarns ensure that your <strong>tank top for men</strong> withstands frequent friction from barbells and benches without stretching or warping out of shape.
    </p>
  </div>
</section>`,
    seo: {
      title: 'Camisetas de Tirantes Gym y Sin Mangas Hombre | FLEX FORM FITNESS',
      description: 'Compra camisetas de tirantes hombre y camisetas sin mangas para gym. Tejidos transpirables y corte deportivo para entrenar con total libertad.',
      keywords: ['camiseta de tirantes hombre', 'camisetas tirante gym', 'tirantes flexform', 'camiseta sin mangas']
    },
    seo_en: {
      title: "Men's Gym Tank Tops & Sleeveless Shirts | FLEX FORM FITNESS",
      description: 'Shop men tank tops and sleeveless gym shirts. Premium breathable cotton, athletic fit, and maximum shoulder mobility for workouts.',
      keywords: ['tank top for men', 'tank tops cotton', 'sleeveless shirt men', 'fit tank tops', 'shirt sleeveless']
    }
  },

  'camisetas-hombre': {
    title: 'Camisetas Hombre',
    title_en: "Men's T-Shirts",
    description: `Descubre nuestras <strong>camisetas de hombre</strong> de ajuste atlético: tejidos suaves, corte favorecedor en pecho y brazos, y la versatilidad ideal para entrenar o vestir a diario.`,
    description_en: `Explore our collection of premium <strong>men's t shirts</strong>: athletic tailored fits, ultra-soft breathable fabrics, and versatile styling for lifting and streetwear.`,
    detailedDescription: `<section class="seo-pillars">
  <div class="container">
    <h2>CAMISETAS DE HOMBRE: RENDIMIENTO ATLÉTICO Y ESTILO VINTAGE</h2>
    
    <p class="intro-text">
      Nuestra selección de <strong>camiseta de hombre</strong> combina la estética del entrenamiento de fuerza con la tecnología textil moderna. Cada <strong>camiseta corta hombre</strong> está diseñada con un corte ergonómico que realza hombros y brazos manteniendo una caída cómoda en el torso, perfecta tanto para levantar peso en el gimnasio como para un estilo urbano y casual.
    </p>

    <h3>Ajuste Atlético que Realza la Silueta</h3>
    <p>
      Diseñadas con patronaje entallado en mangas y pecho, estas <strong>camisetas hombre vintage</strong> ofrecen una silueta atlética que acentúa los hombros sin oprimir el torso, asegurando total libertad de movimiento en cada ejercicio de calentamiento o levantamiento.
    </p>

    <h3>Algodón Premium Suave y Resistente</h3>
    <p>
      Fabricadas con algodón peinado de tacto ultra suave y alta durabilidad, cada <strong>camiseta de hombre</strong> resiste la fricción continua con bancos, barras y mancuernas, garantizando una transpirabilidad óptima durante todo el entrenamiento.
    </p>

    <h3>Versatilidad Dentro y Fuera del Box</h3>
    <p>
      El equilibrio exacto entre prenda de gimnasio y moda deportiva diaria. Una <strong>camiseta corta hombre</strong> esencial para construir un armario funcional que rinda en las series más duras y luzca impecable en cualquier momento del día.
    </p>

    <h3>Guía de Talla y Mantenimiento</h3>
    <p>
      Elige tu <strong>talla habitual</strong> para un ajuste ceñido en hombros y brazos con caída relajada en cintura. Si prefieres un ajuste más holgado, elige una talla más. Lava en agua fría del revés para conservar los colores y la textura suave del algodón lavado tras lavado.
    </p>

    <h3>Costuras Reforzadas y Larga Duración</h3>
    <p>
      Los cuellos reforzados en canalé fino mantienen su elasticidad sin deformarse con el uso. Diseñadas para resistir lavados frecuentes conservando su caída, color y suavidad intactos temporada tras temporada.
    </p>
  </div>
</section>`,
    detailedDescription_en: `<section class="seo-pillars">
  <div class="container">
    <h2>MEN'S T-SHIRTS: ATHLETIC FIT &amp; BODYBUILDING PERFORMANCE</h2>
    
    <p class="intro-text">
      Built for heavy training sessions and everyday lifestyle wear, our premium <strong>t shirt</strong> and <strong>muscle shirts</strong> collection combines athletic tailoring with durable fabrics. Engineered to hug your chest and arms while allowing full mobility during squats, overhead presses, and conditioning.
    </p>

    <h3>Tailored Athletic Fit</h3>
    <p>
      Fitted across the upper body and arms with a comfortable drape through the torso, these <strong>bodybuilder t shirts</strong> flatter your physique without restricting range of motion during workouts.
    </p>

    <h3>Ultra-Soft Ring-Spun Cotton</h3>
    <p>
      Crafted with breathable, durable cotton that feels weightless on the skin and stays resilient through intense training sessions, barbell contact, and frequent washing.
    </p>

    <h3>Seamless Transition from Gym to Street</h3>
    <p>
      Clean lines and minimalist aesthetics make every <strong>t shirt</strong> an everyday activewear essential, providing high-performance gym functionality with versatile casual style.
    </p>

    <h3>Sizing &amp; Fabric Care</h3>
    <p>
      Select your <strong>true size</strong> for an athletic contour fit across the shoulders and chest. For a more relaxed silhouette, size up. Machine wash cold with similar colors and hang dry to maintain shape.
    </p>

    <h3>Reinforced Collar &amp; Seam Integrity</h3>
    <p>
      Precision stitching and high-elastic ribbed collars prevent neckline stretching and ensure that your <strong>muscle shirts</strong> retain their premium look and feel through hundreds of workouts.
    </p>
  </div>
</section>`,
    seo: {
      title: 'Camisetas de Hombre para Gimnasio | FLEX FORM FITNESS',
      description: 'Camisetas de hombre de corte atlético y estilo vintage. Algodón premium y ajuste perfecto para entrenamiento y uso diario.',
      keywords: ['camiseta de hombre', 'camisetas hombre vintage', 'camiseta corta hombre']
    },
    seo_en: {
      title: "Men's Athletic T-Shirts & Muscle Shirts | FLEX FORM FITNESS",
      description: 'Shop men athletic t-shirts and bodybuilding muscle shirts. Premium cotton, flattering fit on chest and arms, engineered for workouts.',
      keywords: ['t shirt', 'muscle shirts', 'bodybuilder t shirts']
    }
  },

  'camisetas-mujer': {
    title: 'Camisetas Mujer',
    title_en: "Women's T-Shirts",
    description: `Estilo, ligereza y confort en cada repetición con nuestras <strong>camisetas mujer</strong> y <strong>camisetas fitness mujer</strong>: tejidos transpirables y cortes favorecedores para tus entrenamientos.`,
    description_en: `Discover our collection of <strong>women's shirts</strong>: lightweight, breathable cotton blends designed for peak fitness performance and everyday active style.`,
    detailedDescription: `<section class="seo-pillars">
  <div class="container">
    <h2>CAMISETAS DE MUJER: RENDIMIENTO, SUAVIDAD Y DISEÑO FITNESS</h2>
    
    <p class="intro-text">
      Nuestra gama de <strong>camisetas mujer</strong> ha sido creada para ofrecer la máxima comodidad en cada serie. Confeccionadas con tejidos elásticos y ligeros, cada <strong>camiseta manga corta mujer</strong> acompaña tus movimientos en el gimnasio, clases de fitness o entrenamientos funcionales sin perder su suavidad ni entorpecer el movimiento.
    </p>

    <h3>Corte Ergonómico y Femenino</h3>
    <p>
      Patrones diseñados para adaptarse a la silueta con total naturalidad. Cada <strong>camiseta fitness mujer</strong> proporciona una caída fluida que no aprieta, garantizando agilidad y confianza en ejercicios de torso, pierna o cardio.
    </p>

    <h3>Transpirabilidad y Confort Térmico</h3>
    <p>
      Tejidos técnicos de algodón y microfibra que facilitan el flujo de aire y evaporan el sudor rápidamente, asegurando que tu <strong>camiseta manga corta mujer</strong> se mantenga fresca y ligera durante toda la sesión.
    </p>

    <h3>Combinación Fácil con Mallas y Tops</h3>
    <p>
      Su corte versátil las convierte en la prenda ideal para llevar sobre tu top deportivo o combinadas con mallas de tiro alto, logrando un conjunto de gimnasio equilibrado y cómodo.
    </p>

    <h3>Guía de Tallas y Cuidado</h3>
    <p>
      Elige tu <strong>talla habitual</strong> para un ajuste cómodo y favorecedor. Si prefieres un estilo más holgado tipo cover-up, puedes elegir una talla más. Lava en frío (30 °C) del revés para preservar la suavidad de las fibras.
    </p>

    <h3>Resistencia y Suavidad Continua</h3>
    <p>
      Fibras de alta calidad que conservan su tacto suave y su color intenso tras múltiples lavados. Lo último en <strong>camisetas mujer</strong> para un estilo deportivo duradero.
    </p>
  </div>
</section>`,
    detailedDescription_en: `<section class="seo-pillars">
  <div class="container">
    <h2>WOMEN'S FITNESS T-SHIRTS: BREATHABLE ACTIVEWEAR ESSENTIALS</h2>
    
    <p class="intro-text">
      Engineered for strength training, cardio, and active living, our collection of <strong>women's shirts</strong> offers a flattering silhouette paired with sweat-wicking functionality. Experience unrestricted movement and lightweight comfort in every workout.
    </p>

    <h3>Athletic &amp; Flattering Fit</h3>
    <p>
      Tailored to move naturally with your body, each <strong>woman shirt</strong> provides optimal coverage and unhindered agility for yoga, lifting, conditioning, or rest days.
    </p>

    <h3>Soft Cotton &amp; Performance Blends</h3>
    <p>
      Made from premium <strong>cotton t shirts for women</strong> that feel weightless against the skin and keep you cool and dry throughout high-intensity workout sets.
    </p>

    <h3>Layering Versatility</h3>
    <p>
      Designed to pair seamlessly over sports bras and with high-waisted gym tights, creating an effortless, stylish activewear outfit.
    </p>

    <h3>Sizing &amp; Care Advice</h3>
    <p>
      Choose your <strong>standard size</strong> for a relaxed athletic fit. For a fitted look, choose one size down. Machine wash cold with like colors to maintain fabric integrity.
    </p>

    <h3>Durable Activewear Design</h3>
    <p>
      Reinforced stitching and shape-retaining fabrics make these <strong>women's shirts</strong> a long-lasting cornerstone of your athletic and everyday rotation.
    </p>
  </div>
</section>`,
    seo: {
      title: 'Camisetas Fitness Mujer y Manga Corta | FLEX FORM FITNESS',
      description: 'Camisetas mujer y camisetas fitness de alta transpirabilidad y corte femenino. Diseñadas para entrenar con total confort y estilo.',
      keywords: ['camisetas mujer', 'camiseta manga corta mujer', 'camiseta fitness mujer']
    },
    seo_en: {
      title: "Women's Fitness T-Shirts & Active Tops | FLEX FORM FITNESS",
      description: 'Shop women fitness t-shirts and cotton activewear tops. Breathable, sweat-wicking, and tailored for strength training and gym sessions.',
      keywords: ["women's shirt", 'woman shirt', 'cotton t shirts for women']
    }
  },

  'leggings-mujer': {
    title: 'Leggings Mujer',
    title_en: "Women's Leggings",
    description: `Descubre nuestras <strong>mallas mujer</strong> y <strong>leggins mujer deporte</strong>: tiro alto, efecto moldeador, tejido squat-proof 100% opaco y compresión perfecta para entrenar sin distracciones.`,
    description_en: `Experience maximum support with our high-waisted <strong>women legging</strong> collection: squat-proof, ultra-stretch fabrics engineered for gym performance.`,
    detailedDescription: `<section class="seo-pillars">
  <div class="container">
    <h2>MALLAS Y LEGGINGS DE MUJER: MÁXIMA SUJECIÓN Y CONFORT SQUAT-PROOF</h2>
    
    <p class="intro-text">
      Nuestra colección de <strong>mallas de mujer</strong> está diseñada para ofrecer una sujeción excepcional en cada sentadilla, zancada o sesión de pierna. Confeccionadas con tejidos técnicos de compresión elástica en 4 direcciones, cada par de <strong>leggins mujer deporte</strong> estiliza tu figura, proporciona soporte muscular y garantiza una opacidad total en cualquier movimiento.
    </p>

    <h3>Cintura Alta y Efecto Moldeador Anti-Deslizante</h3>
    <p>
      La banda de cintura elástica de tiro alto asegura que tus <strong>mallas mujer</strong> se mantengan en su sitio sin deslizarse ni enrollarse durante el ejercicio, ofreciendo un soporte firme en la zona del core y la zona lumbar.
    </p>

    <h3>100% Squat-Proof y Cero Transparencias</h3>
    <p>
      Tejido denso de alta elasticidad que ofrece cobertura completa en flexión máxima. Entrena con total tranquilidad sabiendo que tus <strong>mallas gimnasio mujer</strong> son totalmente opacas bajo cualquier iluminación de gimnasio.
    </p>

    <h3>Transpirabilidad y Secado Rápido</h3>
    <p>
      Fibras de microfibra transpirable que evacúan el sudor al instante para mantener la piel fresca y seca. Las <strong>mallas</strong> ideales para levantamiento de pesas, cross-training, yoga o running.
    </p>

    <h3>Guía de Tallas y Ajuste Compresivo</h3>
    <p>
      Nuestros <strong>leggins mujer deporte</strong> ofrecen un ajuste compresivo que moldea sin restringir. Te recomendamos elegir tu <strong>talla habitual</strong>. Para prolongar la vida del elastano, lava en agua fría sin suavizante y evita el calor directo de la secadora.
    </p>

    <h3>Costuras Planas Anti-Rozaduras</h3>
    <p>
      El acabado con costuras planas y refuerzo ergonómico en la entrepierna previene cualquier fricción molesta, permitiendo una experiencia de entrenamiento cómoda y sin distracciones.
    </p>
  </div>
</section>`,
    detailedDescription_en: `<section class="seo-pillars">
  <div class="container">
    <h2>WOMEN'S HIGH-WAISTED GYM LEGGINGS: SQUAT-PROOF COMPRESSION</h2>
    
    <p class="intro-text">
      Engineered for peak gym performance, our <strong>legging for women</strong> collection delivers supreme support and non-slip confidence. Featuring 4-way stretch compression that contours your shape while remaining 100% squat-proof through every deep rep and lunge.
    </p>

    <h3>Non-Slip High Waistband</h3>
    <p>
      A supportive high-rise waistband keeps each <strong>women legging</strong> locked securely in place without rolling down or pinching during squats, jumps, or sprints.
    </p>

    <h3>100% Squat-Proof Opacity</h3>
    <p>
      Heavy-gauge interlocking fabric guarantees complete coverage and zero sheer transparency under bright gym lighting, so you can train with complete confidence.
    </p>

    <h3>Moisture-Wicking Flexibility</h3>
    <p>
      Fast-drying breathable microfibers draw perspiration away from the skin, making our <strong>legging</strong> lineup ideal for heavy lifting, HIIT, yoga, and athleisure wear.
    </p>

    <h3>Sizing &amp; Fabric Care</h3>
    <p>
      Order your <strong>true size</strong> for an optimal sculpting compression fit. Wash inside out in cold water without fabric softeners, and lay flat or hang dry to preserve spandex elasticity.
    </p>

    <h3>Chafe-Free Flatlock Seams</h3>
    <p>
      Smooth ergonomic flat seams reduce friction against the skin, ensuring full comfort through long training sessions.
    </p>
  </div>
</section>`,
    seo: {
      title: 'Mallas y Leggins Mujer Deporte | FLEX FORM FITNESS',
      description: 'Mallas mujer y leggings deportivos de tiro alto 100% squat-proof. Efecto moldeador, compresión y máxima opacidad para entrenar en el gimnasio.',
      keywords: ['mallas', 'mallas mujer', 'mallas de mujer', 'leggins mujer deporte', 'mallas gimnasio mujer']
    },
    seo_en: {
      title: "Women's High-Waisted Gym Leggings | FLEX FORM FITNESS",
      description: 'Shop high-waisted women leggings and workout tights. Squat-proof, compressive, and breathable for lifting, yoga, and fitness training.',
      keywords: ['legging', 'women legging', 'legging for women']
    }
  },

  'tirantes-mujer': {
    title: 'Tirantes Mujer',
    title_en: "Women's Tank Tops",
    description: `Entrena con frescura y ligereza con nuestras <strong>camisetas tirantes mujer</strong>: corte deportivo, espalda nadadora y tejidos suaves para tus sesiones de fitness.`,
    description_en: `Stay cool and agile with our athletic <strong>tank womens</strong> collection: lightweight, racerback designs engineered for unrestricted gym training.`,
    detailedDescription: `<section class="seo-pillars">
  <div class="container">
    <h2>CAMISETAS DE TIRANTES MUJER: MÁXIMA FRESCURA Y LIBERTAD</h2>
    
    <p class="intro-text">
      Nuestra gama de <strong>camisetas tirantes mujer</strong> está diseñada para quienes buscan entrenar ligeras, frescas y sin restricciones. Los cortes atléticos en espalda y hombros proporcionan una ventilación continua para mantenerte cómoda en las sesiones de gimnasio más intensas.
    </p>

    <h3>Espalda Nadadora y Agilidad de Movimiento</h3>
    <p>
      Los <strong>tirantes mujer</strong> con corte ergonómico liberan los omóplatos, facilitando el rango completo de movimiento en ejercicios de tracción, empuje de hombro o estiramientos sin tiranteces.
    </p>

    <h3>Tejidos Ultra Ligeros y Transpirables</h3>
    <p>
      Confeccionadas con materiales elásticos y suaves que evacúan la humedad rápidamente, nuestras <strong>camisetas deportivas tirantes</strong> evitan rozaduras y mantienen una sensación fresca durante todo el entrenamiento.
    </p>

    <h3>Ajuste Cómodo y Estilo Deportivo</h3>
    <p>
      Su caída fluida combina a la perfección con tus mallas de tiro alto o shorts favoritos, ideal tanto para entrenamiento de fuerza como para clases colectivas de cardio o pilates.
    </p>

    <h3>Guía de Tallas y Cuidado</h3>
    <p>
      Elige tu <strong>talla habitual</strong> para un ajuste atlético que acompañe tu figura. Si prefieres mayor holgura en el torso, opta por una talla superior. Lava en frío del revés para preservar los tejidos.
    </p>

    <h3>Acabados Suaves y Duraderos</h3>
    <p>
      Costuras redondeadas de tacto suave que no dejan marcas ni rozan. Prendas resistentes diseñadas para acompañarte en tus entrenamientos diarios conservando su color y forma.
    </p>
  </div>
</section>`,
    detailedDescription_en: `<section class="seo-pillars">
  <div class="container">
    <h2>WOMEN'S WORKOUT TANK TOPS: LIGHTWEIGHT FREEDOM &amp; COMFORT</h2>
    
    <p class="intro-text">
      Designed for high-intensity training, our <strong>tank top women's</strong> collection provides targeted ventilation and unrestricted shoulder mobility. Beat the heat and keep your focus locked purely on your workout performance.
    </p>

    <h3>Racerback Shoulder Mobility</h3>
    <p>
      The ergonomic racerback design in every <strong>tank womens</strong> garment frees up your shoulder blades for full range on pull-downs, lateral raises, and overhead presses.
    </p>

    <h3>Moisture-Wicking Softness</h3>
    <p>
      Ultralight, breathable fabrics draw sweat away from the body, keeping you dry and focused through cardio, lifting, and functional conditioning.
    </p>

    <h3>Versatile Gym Style</h3>
    <p>
      Flattering athletic drape that pairs seamlessly with high-waisted leggings and sports bras for an effortless, confident gym outfit.
    </p>

    <h3>Sizing &amp; Care</h3>
    <p>
      Select your <strong>standard size</strong> for an active fit. Size up if you prefer a looser, flowing drape. Machine wash cold on a gentle cycle and hang dry.
    </p>

    <h3>Durable Shape Retention</h3>
    <p>
      Quality fabrics resist pilling and retain their original stretch and vibrant colors through repeated training sessions and washes.
    </p>
  </div>
</section>`,
    seo: {
      title: 'Camisetas de Tirantes Mujer Gimnasio | FLEX FORM FITNESS',
      description: 'Camisetas de tirantes mujer y camisetas deportivas para fitness. Espalda nadadora, tejidos ultra transpirables y máxima movilidad.',
      keywords: ['camiseta tirantes mujer', 'tirantes mujer', 'camisetas deportivas tirantes']
    },
    seo_en: {
      title: "Women's Workout Tank Tops | FLEX FORM FITNESS",
      description: 'Shop athletic tank tops for women. Lightweight racerback fitness tanks made from breathable sweat-wicking fabrics for gym sessions.',
      keywords: ['tank womens', "tank top women's"]
    }
  },

  'tops-mujer': {
    title: 'Tops Deportivos Mujer',
    title_en: "Women's Sports Bras & Crop Tops",
    description: `Descubre nuestros <strong>tops de mujer</strong> y <strong>sujetadores deportivos</strong>: sujeción óptima, copas ergonómicas y tejidos de alta transpirabilidad para entrenamientos de impacto.`,
    description_en: `Discover our high-support <strong>gym tops womens</strong> and sports bras: compressive, comfortable fits engineered for intense athletic training.`,
    detailedDescription: `<section class="seo-pillars">
  <div class="container">
    <h2>TOPS DE MUJER Y SUJETADORES DEPORTIVOS: SUJECIÓN Y ESTILO</h2>
    
    <p class="intro-text">
      Nuestra selección de <strong>tops de mujer</strong> ofrece la combinación definitiva entre firmeza, comodidad y estética deportiva. Cada <strong>top deportivo mujer</strong> está confeccionado con bandas elásticas reforzadas que brindan una sujeción segura en movimientos de medio y alto impacto sin oprimir ni dejar marcas en la piel.
    </p>

    <h3>Sujeción Firme Anti-Rebote</h3>
    <p>
      Diseñado como el <strong>sujetador deportivo</strong> ideal para levantamiento de pesas, HIIT o entrenamientos de fuerza, minimizando el rebote y cuidando tu confort en cada ejercicio.
    </p>

    <h3>Tejidos Transpirables y Copas Ergonómicas</h3>
    <p>
      Materiales elásticos de secado rápido que favorecen la evaporación del sudor, manteniendo la piel seca y fresca durante las sesiones de entrenamiento más exigentes.
    </p>

    <h3>Diseño Moderno y Combinable</h3>
    <p>
      Luce un look fitness impecable combinando tu <strong>top deportivo mujer</strong> con nuestras mallas de tiro alto a juego, tanto en el gimnasio como en actividades deportivas al aire libre.
    </p>

    <h3>Guía de Tallas y Soporte</h3>
    <p>
      Elige tu <strong>talla habitual</strong> guiándote por el contorno de pecho para conseguir el nivel de compresión y sujeción óptimo. Lava en agua fría (30 °C) en programa delicado para proteger las bandas elásticas.
    </p>

    <h3>Materiales Suaves y Duraderos</h3>
    <p>
      Fibras técnicas que resisten el uso intensivo sin perder elasticidad ni deformar las copas, garantizando un ajuste seguro entrenamiento tras entrenamiento.
    </p>
  </div>
</section>`,
    detailedDescription_en: `<section class="seo-pillars">
  <div class="container">
    <h2>WOMEN'S SPORTS BRAS &amp; GYM TOPS: HIGH SUPPORT &amp; ALL-DAY COMFORT</h2>
    
    <p class="intro-text">
      Engineered for active athletes, our <strong>gym tops womens</strong> and sports bra collection delivers maximum stability, comfort, and unrestricted motion. Keep your focus locked on your performance through every dynamic set.
    </p>

    <h3>High-Impact Bounce Control</h3>
    <p>
      Reinforced elastic underbands provide dependable support for heavy lifting, interval training, and cardio without digging into skin or causing chafing.
    </p>

    <h3>Sweat-Wicking Breathability</h3>
    <p>
      Moisture-management fabrics keep you cool, dry, and comfortable, making these <strong>shirt tops</strong> an activewear staple for high-energy training.
    </p>

    <h3>Sleek Athletic Silhouette</h3>
    <p>
      Elevate your gym aesthetic with modern <strong>for women top</strong> designs that pair perfectly with high-waisted seamless leggings and workout shorts.
    </p>

    <h3>Sizing &amp; Care Recommendations</h3>
    <p>
      Order your <strong>standard sports bra size</strong> based on your bust measurement for an optimal snug compression fit. Machine wash cold on delicate cycle and air dry.
    </p>

    <h3>Long-Lasting Elasticity</h3>
    <p>
      High-grade technical fabrics maintain compressive tension and vibrant colors through repeated training sessions and washes.
    </p>
  </div>
</section>`,
    seo: {
      title: 'Tops Deportivos y Sujetadores Fitness Mujer | FLEX FORM FITNESS',
      description: 'Tops de mujer y sujetadores deportivos de alta sujeción. Confort, transpirabilidad y diseño ergonómico para entrenamientos intensos.',
      keywords: ['tops de mujer', 'sujetador deportivo', 'top deportivo mujer']
    },
    seo_en: {
      title: "Women's Sports Bras & Workout Gym Tops | FLEX FORM FITNESS",
      description: 'Shop high-support gym tops for women and sports bras. Compressive, sweat-wicking, and comfortable for high-intensity training.',
      keywords: ['gym tops womens', 'shirt tops', 'for women top']
    }
  },

  'hombre': {
    title: 'Ropa de Hombre',
    title_en: "Men's Activewear",
    description: `Catálogo completo de <strong>ropa deportiva para hombre</strong>: camisetas oversized, tirantes, sudaderas y prendas técnicas de alto rendimiento.`,
    description_en: `Explore our complete <strong>men's activewear</strong> collection: oversized pump covers, gym tank tops, hoodies, and high-performance training gear.`,
    detailedDescription: `<section class="seo-pillars">
  <div class="container">
    <h2>ROPA DEPORTIVA DE HOMBRE: ALTO RENDIMIENTO Y ESTILO BODYBUILDING</h2>
    
    <p class="intro-text">
      Nuestra colección de hombre está diseñada para atletas que entrenan con máxima intensidad. Materiales resistentes, patronajes atléticos y cortes modernos diseñados para soportar el castigo del gimnasio y lucir impecable en la calle.
    </p>

    <h3>Patronajes Heavyweight &amp; Oversized</h3>
    <p>
      Prendas con caída estructurada y hombros caídos pensadas para destacar el trabajo de hipertrofia en el gimnasio y mantener el calor muscular durante las sesiones.
    </p>

    <h3>Máxima Transpirabilidad y Movilidad</h3>
    <p>
      Tejidos de algodón y elastano de alta calidad que facilitan el flujo de aire y no limitan ningún ejercicio de empuje, tracción o sentadilla.
    </p>

    <h3>Durabilidad Comprobada</h3>
    <p>
      Costuras reforzadas pensadas para resistir el roce continuo con barras, discos, mancuernas y múltiples lavados sin perder su ajuste.
    </p>
  </div>
</section>`,
    detailedDescription_en: `<section class="seo-pillars">
  <div class="container">
    <h2>MEN'S ACTIVEWEAR &amp; GYM APPAREL: HIGH-PERFORMANCE TRAINING GEAR</h2>
    
    <p class="intro-text">
      Built for lifters and dedicated athletes. From heavy-drape oversized tees to lightweight tank tops and hoodies, our gear is engineered for maximum performance and street-ready style.
    </p>

    <h3>Heavyweight &amp; Athletic Fits</h3>
    <p>
      Structured pump covers and fitted tees designed to highlight upper-body proportions while providing full mobility during lifts.
    </p>

    <h3>Unrestricted Mobility</h3>
    <p>
      Ergonomic cuts that support full depth and range in presses, rows, and heavy squats without fabric resistance.
    </p>

    <h3>Rugged Construction</h3>
    <p>
      Built to handle barbell friction, intense sweat, and rigorous washing cycles while keeping its signature shape.
    </p>
  </div>
</section>`,
    seo: {
      title: 'Ropa Deportiva Hombre y Gymwear | FLEX FORM FITNESS',
      description: 'Ropa de hombre para gimnasio y fitness. Camisetas oversize, tirantes, sudaderas y ropa de culturismo de alta calidad.',
      keywords: ['ropa deportiva hombre', 'ropa gimnasio hombre', 'camisetas gym hombre']
    },
    seo_en: {
      title: "Men's Gym Clothes & Activewear | FLEX FORM FITNESS",
      description: "Shop men's gym apparel and activewear. Oversized t-shirts, stringers, tanks, and workout clothes built for athletes.",
      keywords: ['gym clothes men', "men's activewear", 'bodybuilding clothing men']
    }
  },

  'mujer': {
    title: 'Ropa de Mujer',
    title_en: "Women's Activewear",
    description: `Colección de <strong>ropa de gimnasio para mujer</strong>: mallas moldeadoras, tops deportivos, camisetas y tirantes de máximo confort y sujeción.`,
    description_en: `Discover our full <strong>women's gymwear</strong> collection: high-waisted seamless leggings, sports bras, fitness tees, and athletic tank tops.`,
    detailedDescription: `<section class="seo-pillars">
  <div class="container">
    <h2>ROPA FITNESS DE MUJER: SUJECIÓN, CONFORT Y ESTILO EN CADA SERIE</h2>
    
    <p class="intro-text">
      Diseñada para mujeres apasionadas por el entrenamiento de fuerza y el fitness. Prendas ergonómicas que aúnan sujeción firme, tejidos opacos 100% squat-proof y un diseño moderno que estiliza la figura.
    </p>

    <h3>Tejidos Squat-Proof y Compresivos</h3>
    <p>
      Mallas y shorts 100% opacos de tiro alto con efecto moldeador anti-deslizamiento para entrenar con total tranquilidad.
    </p>

    <h3>Soporte Firme y Confort Térmico</h3>
    <p>
      Tops y sujetadores que garantizan sujeción en ejercicios de alto impacto sin rozaduras ni molestias en la piel.
    </p>

    <h3>Ligereza y Transpirabilidad</h3>
    <p>
      Camisetas y tirantes con tecnología de secado rápido para mantenerte fresca en cada sesión de entrenamiento.
    </p>
  </div>
</section>`,
    detailedDescription_en: `<section class="seo-pillars">
  <div class="container">
    <h2>WOMEN'S GYM CLOTHES &amp; ACTIVEWEAR: FLATTERING &amp; HIGH-SUPPORT</h2>
    
    <p class="intro-text">
      Tailored for active women who train with passion. Our activewear pairs compressive, squat-proof support with soft, breathable fabrics for confidence in every workout.
    </p>

    <h3>Squat-Proof Compression</h3>
    <p>
      High-waisted leggings and shorts designed to stay firmly in place with zero sheer opacity during deep squats.
    </p>

    <h3>High-Impact Support</h3>
    <p>
      Sports bras that minimize bounce while maximizing breathable comfort through intense workouts.
    </p>

    <h3>Sweat-Wicking Softness</h3>
    <p>
      Lightweight tops crafted for cool, dry workouts and everyday active living.
    </p>
  </div>
</section>`,
    seo: {
      title: 'Ropa de Gimnasio Mujer y Mallas Fitness | FLEX FORM FITNESS',
      description: 'Ropa deportiva de mujer para gimnasio. Mallas squat-proof, tops deportivos, camisetas y tirantes de alta calidad.',
      keywords: ['ropa gimnasio mujer', 'ropa fitness mujer', 'mallas mujer deporte']
    },
    seo_en: {
      title: "Women's Workout Clothes & Gym Activewear | FLEX FORM FITNESS",
      description: "Shop women's gym wear, squat-proof leggings, sports bras, and fitness tops engineered for strength and conditioning.",
      keywords: ['gym clothes women', "women's activewear", 'workout leggings for women']
    }
  },

  'mas-vendidos': {
    title: 'Más Vendidos',
    title_en: "Best Sellers",
    description: `Las prendas de <strong>ropa deportiva más populares</strong> y mejor valoradas por nuestra comunidad fitness. Calidad contrastada en cada producto.`,
    description_en: `Discover our most popular and highest-rated <strong>fitness activewear</strong> best sellers chosen by dedicated athletes worldwide.`,
    seo: {
      title: 'Ropa Deportiva Más Vendida | FLEX FORM FITNESS',
      description: 'Descubre los productos y ropa fitness más vendidos de FlexForm Fitness. Calidad y rendimiento contrastados por atletas.',
      keywords: ['ropa deportiva mas vendida', 'top ventas gym', 'mejores productos fitness']
    },
    seo_en: {
      title: "Best Selling Gym Apparel & Activewear | FLEX FORM FITNESS",
      description: 'Explore the best-selling gym clothes and athletic gear from FlexForm Fitness. Top-rated gear for serious lifters.',
      keywords: ['best seller gym clothes', 'popular activewear', 'top workout clothes']
    }
  },

  'mas-populares': {
    title: 'Más Populares',
    title_en: "Trending Gear",
    description: `Las últimas tendencias en <strong>ropa fitness y culturismo</strong>. Diseños destacados y prendas favoritas de nuestros atletas.`,
    description_en: `The latest trending <strong>fitness clothing</strong> and gymwear essentials favorite among dedicated lifters.`,
    seo: {
      title: 'Ropa de Gimnasio Más Popular | FLEX FORM FITNESS',
      description: 'Las tendencias más populares en ropa de entrenamiento y gymwear. Estilo y rendimiento garantizados.',
      keywords: ['ropa fitness popular', 'tendencias gym', 'ropa culturismo']
    },
    seo_en: {
      title: "Trending Fitness Gear & Gymwear | FLEX FORM FITNESS",
      description: 'Discover trending workout clothes and bodybuilding activewear favorites from FlexForm Fitness.',
      keywords: ['trending gym clothes', 'popular fitness wear', 'bodybuilding trends']
    }
  },

  'F3-survivor': {
    title: 'F3 x SurvivorBodyGYM',
    title_en: "F3 x SurvivorBodyGYM Edition",
    description: `Edición exclusiva <strong>F3 x SurvivorBodyGYM</strong>: prendas de edición limitada inspiradas en la cultura del culturismo de máxima exigencia.`,
    description_en: `Exclusive <strong>F3 x SurvivorBodyGYM</strong> limited edition collab: dedicated activewear celebrating hardcore bodybuilding culture.`,
    seo: {
      title: 'F3 x SurvivorBodyGYM Edición Limitada | FLEX FORM FITNESS',
      description: 'Colección especial F3 x SurvivorBodyGYM. Ropa de entrenamiento exclusiva y resistente para culturistas exigentes.',
      keywords: ['F3 survivor', 'survivor body gym', 'edicion limitada culturismo']
    },
    seo_en: {
      title: "F3 x SurvivorBodyGYM Exclusive Collab | FLEX FORM FITNESS",
      description: 'Exclusive F3 x SurvivorBodyGYM limited edition apparel. Heavy-duty gymwear inspired by hardcore strength training.',
      keywords: ['F3 survivor', 'survivor body gym', 'limited edition activewear']
    }
  },

  'pagina-de-inicio': {
    title: 'Catálogo Principal',
    title_en: "Main Catalog",
    description: `Explora el catálogo completo de <strong>ropa deportiva y accesorios fitness</strong> de FlexForm Fitness: rendimiento, calidad y durabilidad en cada prenda.`,
    description_en: `Explore the complete collection of <strong>high-performance activewear</strong> from FlexForm Fitness: designed for dedicated athletes.`,
    seo: {
      title: 'Catálogo Completo de Ropa Fitness | FLEX FORM FITNESS',
      description: 'Ropa deportiva de alto rendimiento para hombre y mujer. Diseñada para atletas dedicados que buscan estilo y durabilidad.',
      keywords: ['ropa deportiva', 'ropa fitness', 'ropa gimnasio', 'flexform fitness']
    },
    seo_en: {
      title: "Complete Athletic & Fitness Catalog | FLEX FORM FITNESS",
      description: 'High-performance sportswear for men and women. Built for dedicated athletes who demand quality, durability, and style.',
      keywords: ['fitness apparel', 'gym clothes', 'activewear', 'flexform fitness']
    }
  }
};

async function run() {
  console.log('Fetching collections from Firestore...');
  const snap = await db.collection('collections').get();
  
  if (snap.empty) {
    console.log('No collections found.');
    return;
  }
  
  console.log(`Found ${snap.size} collections. Updating SEO texts and keywords...\n`);
  
  let updated = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    const slug = data.slug;
    
    if (collectionSEOData[slug]) {
      const seoInfo = collectionSEOData[slug];
      
      const updatePayload = {
        title: seoInfo.title || data.title,
        title_en: seoInfo.title_en || data.title_en || seoInfo.title,
        description: seoInfo.description,
        description_en: seoInfo.description_en,
        seo: seoInfo.seo,
        seo_en: seoInfo.seo_en,
        updatedAt: new Date()
      };
      
      if (seoInfo.detailedDescription !== undefined) {
        updatePayload.detailedDescription = seoInfo.detailedDescription;
      }
      if (seoInfo.detailedDescription_en !== undefined) {
        updatePayload.detailedDescription_en = seoInfo.detailedDescription_en;
      }
      
      await doc.ref.update(updatePayload);
      console.log(`✓ Updated collection "${data.title}" (slug: ${slug})`);
      updated++;
    } else {
      console.log(`- Skipped collection "${data.title}" (slug: ${slug}) - No SEO definition`);
    }
  }
  
  console.log(`\n🎉 Successfully updated ${updated} collections with deep SEO texts and keywords!`);
}

run().catch((err) => {
  console.error('Error updating collections:', err);
  process.exit(1);
});
