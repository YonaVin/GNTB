(function () {
  if (typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

  const DIST = 26;
  const CAM_ANGLE = (Math.PI / 180) * -32;
  camera.position.set(
    Math.sin(CAM_ANGLE) * DIST,
    6,
    Math.cos(CAM_ANGLE) * DIST
  );
  camera.lookAt(0, -4, 0);

  var canvasEl = document.getElementById('bg-canvas');
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvasEl || undefined });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  if (!canvasEl) {
    var container = document.getElementById('canvas-3d-bg');
    if (container) container.appendChild(renderer.domElement);
    else document.body.appendChild(renderer.domElement);
  }

  scene.add(new THREE.AmbientLight(0x040404, 1));

  const backLight = new THREE.DirectionalLight(0xaabbcc, 1.8);
  backLight.position.set(0, 12, -20);
  scene.add(backLight);

  const backLight2 = new THREE.DirectionalLight(0x667788, 0.4);
  backLight2.position.set(-12, 6, -18);
  scene.add(backLight2);

  const rimLight = new THREE.DirectionalLight(0x8899aa, 0.9);
  rimLight.position.set(10, 6, -15);
  scene.add(rimLight);

  const COLS    = 300;
  const ROWS    = 140;
  const SPACING = 0.32;

  const geometry = new THREE.SphereGeometry(0.12, 7, 7);
  const material = new THREE.MeshPhongMaterial({
    color: 0x888888,
    specular: 0xffffff,
    shininess: 220,
  });

  const mesh = new THREE.InstancedMesh(geometry, material, COLS * ROWS);
  scene.add(mesh);

  const positions = [];
  const dummy = new THREE.Object3D();
  let idx = 0;

  const X_OFFSET = 60 * SPACING;
  const Z_OFFSET = 25 * SPACING;
  const maxZ = (ROWS / 2) * SPACING + Z_OFFSET;

  for (let row = 0; row < ROWS; row++) {
    const zigzag = (row % 2 === 0) ? SPACING * 0.5 : 0;
    for (let col = 0; col < COLS; col++) {
      const x = (col - COLS / 2) * SPACING + X_OFFSET + zigzag;
      const z = (row - ROWS / 2) * SPACING - Z_OFFSET;
      const phase = Math.random() * Math.PI * 0.25;
      const scale = 0.9625 + Math.random() * 0.075;
      const rx = (Math.random() - 0.5) * SPACING * 0.15;
      const rz = (Math.random() - 0.5) * SPACING * 0.15;
      positions.push({ x: x + rx, z: z + rz, phase, scale });
      dummy.position.set(x + rx, 0, z + rz);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(idx++, dummy.matrix);
    }
  }
  mesh.instanceMatrix.needsUpdate = true;

  const colorDark   = new THREE.Color(0x050505);
  const colorMid    = new THREE.Color(0x3a4455);
  const colorBright = new THREE.Color(0xe8e8e8);

  const LOOP = 10;
  const W = (2 * Math.PI) / LOOP;

  function getWaveY(x, z, t) {
    return Math.sin(x * 0.30 + t * (2 * W)) * 1.25
         + Math.cos(z * 0.18 + t * (1 * W)) * 0.75
         + Math.sin((x * 0.4 + z * 0.25) * 0.38 + t * (3 * W)) * 0.4;
  }

  const isMobile = window.innerWidth < 768;

  let mouseX = 0, mouseY = 0;
  let targetX = 0, targetY = 0;
  const MAX_DEG = 1.5;

  window.addEventListener('mousemove', function (e) {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  window.addEventListener('touchmove', function (e) {
    var touch = e.touches[0];
    mouseX = (touch.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (touch.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  const clock = new THREE.Clock();
  const BASE_ANGLE = (Math.PI / 180) * -32;
  const BASE_Y = 6;

  if (isMobile) {
    camera.fov = 75;
    camera.updateProjectionMatrix();
  }

  function animate() {
    requestAnimationFrame(animate);

    const elapsed = clock.getElapsedTime();
    const t = elapsed % LOOP;

    targetX += (mouseX - targetX) * 0.02;
    targetY += (mouseY - targetY) * 0.02;

    const angleOffset = targetX * (Math.PI / 180) * MAX_DEG;
    const yOffset     = targetY * MAX_DEG * 0.3;
    const a = BASE_ANGLE + angleOffset;
    camera.position.set(
      Math.sin(a) * DIST,
      BASE_Y - yOffset,
      Math.cos(a) * DIST
    );
    camera.lookAt(0, -4, 0);

    let i = 0;
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const pos = positions[i];
        const y = getWaveY(pos.x, pos.z, t) + Math.sin(t * (2 * W) + pos.phase) * 0.01875;
        dummy.position.set(pos.x, y, pos.z);
        dummy.scale.setScalar(pos.scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        const heightN = Math.max(0, Math.min(1, (y + 2.25) / 4.5));
        const zFade   = Math.max(0, Math.min(1, (pos.z + maxZ * 0.05) / (maxZ * 0.4)));
        const b = heightN * (zFade * zFade * zFade);

        const c = b < 0.5
          ? colorDark.clone().lerp(colorMid,    b * 2)
          : colorMid.clone().lerp(colorBright, (b - 0.5) * 2);
        mesh.setColorAt(i, c);
        i++;
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    renderer.render(scene, camera);
  }

  animate();

  const BASE_WIDTH  = window.innerWidth;
  const BASE_HEIGHT = window.innerHeight;
  const BASE_ASPECT = BASE_WIDTH / BASE_HEIGHT;

  camera.aspect = BASE_ASPECT;
  camera.updateProjectionMatrix();

  window.addEventListener('resize', function () {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);

    const mobile = w < 768;
    camera.fov = mobile ? 75 : 60;

    if (mobile) {
      camera.clearViewOffset();
      camera.aspect = w / h;
    } else {
      const fullW = h * BASE_ASPECT;
      camera.setViewOffset(Math.round(fullW), h, 0, 0, w, h);
      camera.aspect = w / h;
    }
    camera.updateProjectionMatrix();
  });
})();
