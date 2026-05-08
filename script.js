const viewer = document.getElementById('viewer');
const currentFrame = document.getElementById('current-frame');

const track = document.getElementById('track');
const fill = document.getElementById('fill');
const thumb = document.getElementById('thumb');

const totalFrames = 40;

let current = 1;
let isDragging = false;

/* FRAME */

function updateFrame(frame){

  current = frame;

  const number = String(frame).padStart(3,'0');

  currentFrame.src = `frames/ezgif-frame-${number}.png`;

  const percent = ((frame - 1) / (totalFrames - 1)) * 100;

  fill.style.width = `${percent}%`;
  thumb.style.left = `${percent}%`;

}

/* DRAG VIEWER */

viewer.addEventListener('mousemove',(e)=>{

  if(!isDragging) return;

  const rect = viewer.getBoundingClientRect();

  let percent = (e.clientX - rect.left) / rect.width;

  percent = Math.max(0,Math.min(1,percent));

  const frame = Math.round(percent * (totalFrames - 1)) + 1;

  updateFrame(frame);

});

viewer.addEventListener('mousedown',()=>{

  isDragging = true;

});

window.addEventListener('mouseup',()=>{

  isDragging = false;

});

/* SCRUBBER */

track.addEventListener('click',(e)=>{

  const rect = track.getBoundingClientRect();

  let percent = (e.clientX - rect.left) / rect.width;

  percent = Math.max(0,Math.min(1,percent));

  const frame = Math.round(percent * (totalFrames - 1)) + 1;

  updateFrame(frame);

});

/* HOTSPOTS */

const hotspots = document.querySelectorAll('.hotspot');

hotspots.forEach(hotspot=>{

  const button = hotspot.querySelector('.hotspot-btn');

  button.addEventListener('click',(e)=>{

    e.stopPropagation();

    hotspots.forEach(item=>{

      if(item !== hotspot){
        item.classList.remove('active');
      }

    });

    hotspot.classList.toggle('active');

  });

});

document.addEventListener('click',()=>{

  hotspots.forEach(hotspot=>{

    hotspot.classList.remove('active');

  });

});
