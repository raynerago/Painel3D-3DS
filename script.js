/**
 * DEVS.LOG 360° Viewer Engine v2.0
 * Focado em Performance, UX e Pré-carregamento Inteligente
 */

document.addEventListener('DOMContentLoaded', () => {
    
  // CONFIGURAÇÕES
  const config = {
      totalFrames: 40,
      framePath: 'frames/ezgif-frame-',
      frameExt: '.png',
      dragSpeed: 10, // Quanto menor, mais rápido gira no arrasto
      autoRotateSpeed: 120, // ms por frame (não usado inicialmente)
  };

  // DOM ELEMENTS
  const viewer = document.getElementById('viewer');
  const container = document.getElementById('frames-container');
  const initialFrame = document.getElementById('initial-frame');
  const loadingOverlay = document.getElementById('viewer-loading');
  const hintOverlay = document.getElementById('viewer-hint');
  const track = document.getElementById('track');
  const fill = document.getElementById('fill');
  const thumb = document.getElementById('thumb');
  const nav = document.getElementById('main-nav');

  // STATE
  let state = {
      currentFrame: 0, // Frame 001 é índice 0
      images: [],
      loadedCount: 0,
      isAutoRotating: false,
      isDragging: false,
      startX: 0,
      startFrame: 0,
      hasInteracted: false, // Controla o Hint Overlay
      isPreloaded: false
  };


  // 1. GERAÇÃO DE IMAGENS & PRÉ-CARREGAMENTO
  const preloadImages = () => {
      // O frame inicial já existe no HTML. Vamos carregar o resto.
      state.images[0] = initialFrame;
      state.loadedCount = 1; // Começa com 1 (o inicial)

      // Função para padronizar números (ex: 1 -> 001)
      const pad = (num) => num.toString().padStart(3, '0');

      for (let i = 2; i <= config.totalFrames; i++) {
          const img = new Image();
          const frameNum = pad(i);
          img.src = `${config.framePath}${frameNum}${config.ext || config.frameExt}`;
          img.alt = `Painel frame ${frameNum}`;
          
          img.onload = () => {
              state.loadedCount++;
              checkAllLoaded();
          };
          img.onerror = () => {
              console.error(`Erro ao carregar frame: ${img.src}`);
              state.loadedCount++; // Conta mesmo com erro para não travar o loading
              checkAllLoaded();
          };

          state.images[i-1] = img; // Armazena na array
          container.appendChild(img); // Adiciona ao DOM (escondido por CSS)
      }
  };

  const checkAllLoaded = () => {
      // Atualiza texto de loading (opcional)
      // loadingOverlay.querySelector('p').innerText = `Carregando (${state.loadedCount}/${config.totalFrames})...`;

      if (state.loadedCount >= config.totalFrames) {
          state.isPreloaded = true;
          loadingOverlay.classList.add('hidden'); // Esconde loading
          // O hint overlay permanece visível até a primeira interação
      }
  };


  // 2. CORE: EXIBIÇÃO DE FRAMES
  const showFrame = (index) => {
      const frames = container.querySelectorAll('img');

      const newIndex = (Math.round(index) + config.totalFrames) % config.totalFrames;

      if (newIndex === state.currentFrame) return;

      // mantém referência do antigo
      const old = state.currentFrame;

      state.currentFrame = newIndex;

      frames.forEach(img => img.classList.remove('active'));

      frames[old].style.zIndex = 1;
      frames[newIndex].style.zIndex = 2;

      frames[newIndex].classList.add('active');

      updateScrubber(newIndex);
  };


  // 3. SCRUBBER UI UPDATE
  const updateScrubber = (frameIndex) => {
      // Progresso de 0 a 100 baseado no frame atual
      const percent = (frameIndex / (config.totalFrames - 1)) * 100;
      
      // Usamos requestAnimationFrame para updates visuais suaves
      requestAnimationFrame(() => {
          fill.style.width = `${percent}%`;
          thumb.style.left = `${percent}%`;
      });
  };


  // 4. INTERAÇÃO: ARRASTO (MOUSE & TOUCH) - NO VIEWER
  const handleDragStart = (e) => {
      if (!state.isPreloaded) return;
      
      state.isDragging = true;
      state.startX = e.touches ? e.touches[0].clientX : e.clientX;
      state.startFrame = state.currentFrame;
      
      viewer.classList.add('grabbing');

      // Primeira interação: esconde o hint
      if (!state.hasInteracted) {
          state.hasInteracted = true;
          hintOverlay.classList.add('hidden');
      }
  };

  const handleDragMove = (e) => {
      if (!state.isDragging) return;
      
      // Impede scroll da página no mobile durante o arrasto
      if (e.cancelable) e.preventDefault();

      const currentX = e.touches ? e.touches[0].clientX : e.clientX;
      const deltaX = currentX - state.startX;
      
      // Calcula quantos frames mover baseado na distância e velocidade configurada
      // Invertemos o deltaX para o giro seguir a direção natural da mão
      const framesToMove = -(deltaX / config.dragSpeed);
      
      showFrame(state.startFrame + framesToMove);
  };

  const handleDragEnd = () => {
      state.isDragging = false;
      viewer.classList.remove('grabbing');
  };


  // 5. INTERAÇÃO: SCRUBBER (CLIQUE & ARRASTO NO TRACK)
  const handleScrubberInteraction = (e) => {
      if (!state.isPreloaded) return;

      const rect = track.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      
      // Calcula porcentagem baseada na posição do clique no track
      let percent = (clientX - rect.left) / rect.width;
      percent = Math.max(0, Math.min(1, percent)); // Clamp entre 0 e 1

      // Converte porcentagem para índice de frame
      const targetFrame = Math.round(percent * (config.totalFrames - 1));
      
      // Esconde hint na primeira interação via scrubber também
      if (!state.hasInteracted) {
          state.hasInteracted = true;
          hintOverlay.classList.add('hidden');
      }

      showFrame(targetFrame, true); // Usa transição leve
  };


  // 6. EVENT LISTENERS
  
  // Viewer Drag
  viewer.addEventListener('mousedown', handleDragStart);
  window.addEventListener('mousemove', handleDragMove);
  window.addEventListener('mouseup', handleDragEnd);

  viewer.addEventListener('touchstart', handleDragStart, { passive: false });
  window.addEventListener('touchmove', handleDragMove, { passive: false });
  window.addEventListener('touchend', handleDragEnd);
  
  // Hint Click (também inicia interação)
  hintOverlay.addEventListener('click', () => {
      state.hasInteracted = true;
      hintOverlay.classList.add('hidden');
  });

  // Scrubber
  track.addEventListener('mousedown', (e) => {
      handleScrubberInteraction(e);
      // Permite arrastar o thumb após clicar
      window.addEventListener('mousemove', handleScrubberInteraction);
      window.addEventListener('mouseup', () => {
          window.removeEventListener('mousemove', handleScrubberInteraction);
      }, { once: true });
  });

  track.addEventListener('touchstart', (e) => {
      handleScrubberInteraction(e);
      // Permite arrastar no mobile
      track.addEventListener('touchmove', handleScrubberInteraction, { passive: false });
      track.addEventListener('touchend', () => {
          track.removeEventListener('touchmove', handleScrubberInteraction);
      }, { once: true });
  }, { passive: false });


  // 7. EFEITOS DE UI (NAV SCROLL & ANIMATIONS)
  let lastScrollTop = 0;
  window.addEventListener('scroll', () => {
      let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Efeito de background na Nav
      if (scrollTop > 50) {
          nav.classList.add('scrolled');
      } else {
          nav.classList.remove('scrolled');
      }
      
      // Esconde Nav ao rolar para baixo, mostra ao rolar para cima (UX)
      if (scrollTop > lastScrollTop && scrollTop > 200) {
          nav.classList.add('hidden');
      } else {
          nav.classList.remove('hidden');
      }
      lastScrollTop = scrollTop;
  }, { passive: true });


  // INITIALIZE
  // Inicia parado no Frame 1 (já definido no HTML)
  updateScrubber(0); 
  
  // Começa carregar o resto após breve delay para priorizar render inicial da página
  setTimeout(preloadImages, 500);

});

let currentSlide = 0;

function moveSlider(direction) {
    const track = document.getElementById('sliderTrack');
    const slides = document.querySelectorAll('.slide-item');
    const totalSlides = slides.length;
    
    // Calcula quantos slides cabem na tela
    const visibleSlides = window.innerWidth > 768 ? 3 : 1;
    const maxIndex = totalSlides - visibleSlides;

    currentSlide += direction;

    // Loop infinito ou travas
    if (currentSlide < 0) currentSlide = 0;
    if (currentSlide > maxIndex) currentSlide = maxIndex;

    const percentage = currentSlide * (100 / visibleSlides);
    track.style.transform = `translateX(-${currentSlide * (slides[0].offsetWidth + 20)}px)`;
}