(() => {
    const {
        ACESFilmicToneMapping, BufferAttribute, BufferGeometry, Color, DirectionalLight, Group,
        HemisphereLight, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, PerspectiveCamera,
        QuadraticBezierCurve3, Quaternion, Scene, ShapeUtils, SphereGeometry, TubeGeometry,
        Vector2, Vector3, WebGLRenderer,
    } = globalThis.ValThree;

    // Normalized, rounded footprint derived from the supplied Val model.
    // The glazing and face are built as separate geometry around this silhouette.
    const footprint = [
        [-.632, .327], [.071, -.354], [.142, -.285], [.144, -.286],
        [.144, -.328], [.158, -.328], [.158, -.325], [.602, -.328],
        [.602, -.092], [.563, -.092], [.561, -.09], [.632, -.022],
        [.244, .354], [.174, .285], [.171, .287], [.171, .327],
    ];
    const height = 2.409;
    const glassBlue = ['#538dab', '#68a2b7', '#5598a8', '#6facc0', '#5b91ae', '#6da6c2', '#477ca5', '#83b6bb'];
    const glassGold = ['#a77b30', '#ba8c37', '#d19e36', '#c5984a', '#d9b36b', '#dfaf54', '#a58343', '#e8bb64'];
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    function meshGeometry(positions) {
        const geometry = new BufferGeometry();
        geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
        geometry.computeVertexNormals();
        return geometry;
    }

    function paint(color, roughness, metalness = 0) {
        return new MeshStandardMaterial({ color, roughness, metalness });
    }

    function quad(positions, start, end, low, high) {
        const a = [start[0], low, start[1]], b = [start[0], high, start[1]];
        const c = [end[0], high, end[1]], d = [end[0], low, end[1]];
        positions.push(...a, ...b, ...c, ...a, ...c, ...d);
    }

    function tower(progress) {
        const group = new Group();
        const walls = [];
        footprint.forEach((start, i) => quad(walls, start, footprint[(i + 1) % footprint.length], 0, height));
        group.add(new Mesh(meshGeometry(walls), paint('#355366', .48, .25)));

        const cap = [];
        const contour = footprint.map(([x, z]) => new Vector2(x, z));
        for (const indices of ShapeUtils.triangulateShape(contour, [])) {
            const [a, b, c] = indices.map(i => contour[i]);
            const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
            const top = cross < 0 ? [a, b, c] : [a, c, b];
            cap.push(...top.flatMap(({ x, y }) => [x, height, y]));
            cap.push(...top.slice().reverse().flatMap(({ x, y }) => [x, 0, y]));
        }
        group.add(new Mesh(meshGeometry(cap), paint('#c4dcd8', .32, .27)));

        const blue = glassBlue.map(color => new Color(color));
        const gold = glassGold.map(color => new Color(color));
        const panes = [];
        const panels = [];
        const stories = 21;
        footprint.forEach(([x, z], i) => {
            const [endX, endZ] = footprint[(i + 1) % footprint.length];
            const dx = endX - x, dz = endZ - z;
            const length = Math.hypot(dx, dz);
            if (length < .015) return;
            const columns = Math.max(1, Math.round(length / .105));
            const edge = t => [x + dx * t + dz / length * .0024, z + dz * t - dx / length * .0024];
            for (let column = 0; column < columns; column++) {
                const a = edge((column + .037) / columns);
                const b = edge((column + .963) / columns);
                for (let story = 0; story < stories; story++) {
                    quad(panes, a, b, height * (story + .034) / stories, height * (story + .937) / stories);
                    panels.push({ index: panels.length, order: story * 257 + ((i * 47 + column * 113) % 257),
                        shade: (story * 17 + column * 31 + i * 7 + Math.floor(story / 5)) % blue.length });
                }
            }
        });
        const goldCount = Math.round(panels.length * clamp(progress, 0, 1));
        const goldPanels = new Set(panels.slice().sort((a, b) => a.order - b.order).slice(0, goldCount).map(panel => panel.index));
        const colors = new Float32Array(panes.length);
        for (const { index, shade } of panels) {
            const { r, g, b } = (goldPanels.has(index) ? gold : blue)[shade];
            for (let vertex = 0; vertex < 6; vertex++) colors.set([r, g, b], index * 18 + vertex * 3);
        }
        const glazing = meshGeometry(panes);
        glazing.setAttribute('color', new BufferAttribute(colors, 3));
        group.add(new Mesh(glazing, new MeshPhysicalMaterial({ vertexColors: true, roughness: .38, metalness: .14, clearcoat: .28 })));
        return group;
    }

    const forward = new Vector3(0, 0, 1);
    function sphereCap(angle, radius) {
        return new SphereGeometry(radius, 36, 18, 0, Math.PI * 2, 0, angle).rotateX(Math.PI / 2);
    }

    function face(root) {
        const sphere = new SphereGeometry(1, 40, 26);
        const porcelain = new MeshPhysicalMaterial({ color: '#fffdf2', roughness: .25, clearcoat: .65 });
        const irisEdge = paint('#263b59', .45);
        const iris = paint('#162e53', .31);
        const pupil = new MeshPhysicalMaterial({ color: '#061020', roughness: .19, clearcoat: .79 });
        const glint = new MeshStandardMaterial({ color: '#fffcf0', emissive: '#fff7ea', emissiveIntensity: .65, roughness: .3 });
        const irisEdgeSurface = sphereCap(.77, 1.004);
        const irisSurface = sphereCap(.68, 1.007);
        const pupilSurface = sphereCap(.52, 1.011);
        const glints = [
            [sphereCap(.15, 1.017), new Vector3(-.32, .45, .82).normalize()],
            [sphereCap(.065, 1.018), new Vector3(.22, -.32, .92).normalize()],
        ];
        const front = .327;
        const eyes = [-.405, -.068].map((x, index) => {
            const globe = new Group();
            globe.position.set(x, 1.62 + index * .026, front + .048);
            globe.scale.set(.158, .181, .119);
            globe.add(new Mesh(sphere, porcelain));
            const gaze = new Group();
            gaze.add(new Mesh(irisEdgeSurface, irisEdge), new Mesh(irisSurface, iris), new Mesh(pupilSurface, pupil));
            for (const [geometry, direction] of glints) {
                const shine = new Mesh(geometry, glint);
                shine.quaternion.setFromUnitVectors(forward, direction);
                gaze.add(shine);
            }
            globe.add(gaze);
            root.add(globe);
            return gaze;
        });
        const left = new Vector3(-.339, 1.33, front + .035);
        const right = new Vector3(-.123, 1.33, front + .035);
        const smile = new QuadraticBezierCurve3(left, new Vector3(-.231, 1.204, front + .066), right);
        root.add(new Mesh(new TubeGeometry(smile, 24, .023, 12, false), pupil));
        for (const tip of [left, right]) {
            const end = new Mesh(sphere, pupil);
            end.position.copy(tip);
            end.scale.setScalar(.023);
            root.add(end);
        }
        return eyes;
    }

    function facadeStars(root, count) {
        if (!count) return;
        const columns = Math.max(3, Math.ceil(Math.sqrt(count * .75)));
        const rows = Math.ceil(count / columns);
        const radius = Math.min(.097, .35 / columns, .45 / rows);
        const face = [], rim = [];
        for (let i = 0; i < count; i++) {
            const row = Math.floor(i / columns);
            const inRow = Math.min(columns, count - row * columns);
            const x = -.225 + (i % columns - (inRow - 1) / 2) * radius * 2.3;
            const y = 1.035 - row * radius * 2.15;
            const point = (n, scale, z) => {
                const angle = Math.PI / 2 + n * Math.PI / 5;
                const length = radius * scale * (n % 2 ? .46 : 1);
                return [x + Math.cos(angle) * length, y + Math.sin(angle) * length, z];
            };
            for (let side = 0; side < 10; side++) {
                rim.push(x, y, .343, ...point(side, 1, .343), ...point(side + 1, 1, .343));
                face.push(x, y, .365, ...point(side, .86, .348), ...point(side + 1, .86, .348));
            }
        }
        const inlay = new Mesh(meshGeometry(rim), paint('#684219', .42, .38));
        const gold = new Mesh(meshGeometry(face), new MeshStandardMaterial({ color: '#ffcf52', emissive: '#bf7300', emissiveIntensity: .26, roughness: .34, metalness: .42 }));
        gold.name = 'facade-stars';
        root.add(inlay, gold);
    }

    function spotlight(scene, color, strength, x, y, z) {
        const light = new DirectionalLight(color, strength);
        light.position.set(x, y, z);
        scene.add(light);
    }

    function releaseScene(scene) {
        const geometries = new Set(), materials = new Set();
        scene.traverse(object => {
            if (!object.isMesh) return;
            geometries.add(object.geometry);
            materials.add(object.material);
        });
        geometries.forEach(geometry => geometry.dispose());
        materials.forEach(material => material.dispose());
    }

    function mount(canvas, progress, stars = 0) {
        const context = canvas.getContext('webgl2', { alpha: true, antialias: true });
        if (!context) return;
        const renderer = new WebGLRenderer({ canvas, context, alpha: true, antialias: true });
        renderer.setClearColor(0, 0);
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        renderer.toneMapping = ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        const scene = new Scene();
        const camera = new PerspectiveCamera(19.1, 1, .2, 35);
        camera.position.set(3.5, 3.02, 7.8);
        camera.lookAt(0, 1.22, 0);
        scene.add(new HemisphereLight('#dae7ff', '#87919e', 1.25));
        spotlight(scene, '#fff2de', 2.65, -4, 6, 5);
        spotlight(scene, '#cfdeff', 1.15, 4, 2.4, 4);
        spotlight(scene, '#cdebf6', 1.9, 2, 4, -5);
        const root = new Group();
        const body = tower(progress);
        const eyes = face(body);
        facadeStars(body, stars);
        body.position.y = -height / 2;
        root.position.y = height / 2;
        root.add(body);
        scene.add(root);

        const motion = matchMedia('(prefers-reduced-motion: reduce)');
        const present = { yaw: 0, pitch: 0, x: 0, y: 0 };
        const target = { ...present };
        const eyeDirection = new Vector3();
        const inverseRotation = new Quaternion();
        const events = new AbortController();
        const options = { signal: events.signal, passive: true };
        let frame = 0;
        let drag = null;
        let contextLost = false;
        function requestDraw() {
            if (!frame && !contextLost) frame = requestAnimationFrame(draw);
        }
        function draw() {
            frame = 0;
            let moving = false;
            for (const key of ['yaw', 'pitch', 'x', 'y']) {
                const delta = target[key] - present[key];
                if (motion.matches || Math.abs(delta) < .001) present[key] = target[key];
                else {
                    present[key] += delta * (key === 'x' || key === 'y' ? .29 : .18);
                    moving = true;
                }
            }
            root.rotation.set(present.pitch, present.yaw, 0, 'YXZ');
            inverseRotation.copy(root.quaternion).invert();
            eyeDirection.set(present.x * .82, present.y * .59, 1).applyQuaternion(camera.quaternion).applyQuaternion(inverseRotation);
            eyeDirection.x = clamp(eyeDirection.x, -.88, .88);
            eyeDirection.y = clamp(eyeDirection.y, -.67, .67);
            eyeDirection.z = Math.max(eyeDirection.z, .62);
            eyeDirection.normalize();
            for (const eye of eyes) eye.quaternion.setFromUnitVectors(forward, eyeDirection);
            renderer.render(scene, camera);
            if (!canvas.hasAttribute('data-rendered')) canvas.setAttribute('data-rendered', '');
            if (moving) requestDraw();
        }
        const size = new ResizeObserver(([entry]) => {
            const { width, height: availableHeight } = entry.contentRect;
            if (!width || !availableHeight) return;
            camera.aspect = width / availableHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(width, availableHeight, false);
            requestDraw();
        });
        size.observe(canvas);

        function reset() {
            drag = null;
            Object.assign(target, { yaw: 0, pitch: 0, x: 0, y: 0 });
            requestDraw();
        }
        window.addEventListener('pointermove', event => {
            if (drag?.id === event.pointerId) {
                target.yaw = clamp(drag.yaw + (event.clientX - drag.x) * .012, -1.35, 1.35);
                target.pitch = clamp(drag.pitch + (event.clientY - drag.y) * .006, -.23, .23);
                requestDraw();
                return;
            }
            if (drag || motion.matches || event.pointerType !== 'mouse') return;
            const { x, y, width, height: viewHeight } = canvas.getBoundingClientRect();
            target.x = clamp((event.clientX - x - width * .37) / Math.max(130, width * .73), -1, 1);
            target.y = clamp((y + viewHeight * .38 - event.clientY) / Math.max(95, viewHeight * .57), -1, 1);
            target.yaw = target.x * .27;
            target.pitch = -target.y * .105;
            requestDraw();
        }, options);
        canvas.addEventListener('pointerdown', event => {
            if (!event.isPrimary || event.button !== 0) return;
            drag = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw: present.yaw, pitch: present.pitch };
            canvas.setPointerCapture(event.pointerId);
        }, options);
        canvas.addEventListener('lostpointercapture', () => { drag = null; }, options);
        document.documentElement.addEventListener('pointerleave', reset, options);
        window.addEventListener('blur', reset, options);
        motion.addEventListener('change', reset, options);

        canvas.addEventListener('webglcontextlost', event => {
            event.preventDefault();
            contextLost = true;
            cancelAnimationFrame(frame);
            frame = 0;
            canvas.removeAttribute('data-rendered');
        }, { signal: events.signal });
        canvas.addEventListener('webglcontextrestored', () => {
            contextLost = false;
            requestDraw();
        }, options);

        const main = canvas.closest('main');
        const removal = new MutationObserver(() => {
            if (canvas.isConnected) return;
            removal.disconnect();
            events.abort();
            size.disconnect();
            cancelAnimationFrame(frame);
            releaseScene(scene);
            renderer.dispose();
            renderer.forceContextLoss();
        });
        removal.observe(main, { childList: true });
    }

    globalThis.mountValModel = mount;
})();
