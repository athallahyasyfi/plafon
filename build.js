const fs = require('fs');
const path = require('path');

// Target directory helper
const ensureDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

// Normalize any YouTube URL to the proper embed format
// Handles: youtu.be/ID, youtube.com/watch?v=ID, youtube.com/embed/ID, youtube.com/shorts/ID
const normalizeYouTubeUrl = (url) => {
    if (!url) return url;
    // Already an embed URL
    if (url.includes('youtube.com/embed/')) return url.split('?')[0];
    // YouTube Shorts: youtube.com/shorts/ID
    const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
    // youtu.be short link
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
    // youtube.com/watch?v=ID
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
    return url;
};

// Consolidate JSON folder into single array and write to destination
const consolidateCollection = (srcDir, destFile) => {
    console.log(`Consolidating collection from ${srcDir} to ${destFile}...`);
    ensureDir(path.dirname(destFile));
    
    if (!fs.existsSync(srcDir)) {
        console.warn(`Source directory ${srcDir} does not exist. Skipping consolidation.`);
        fs.writeFileSync(destFile, JSON.stringify([], null, 2));
        return [];
    }

    const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.json'));
    const items = [];

    files.forEach(file => {
        try {
            const raw = fs.readFileSync(path.join(srcDir, file), 'utf8');
            const data = JSON.parse(raw);
            items.push(data);
        } catch (err) {
            console.error(`Error parsing JSON file ${file}:`, err);
        }
    });

    fs.writeFileSync(destFile, JSON.stringify(items, null, 2));
    console.log(`Successfully written ${items.length} items to ${destFile}.`);
    return items;
};

// Main build runner
const runBuild = () => {
    console.log('--- STARTING BUNGA MAYANG PLAFON BUILD ---');

    // 1. Consolidate JSON collections for products, projects, videos, branches
    const products = consolidateCollection(
        path.join(__dirname, 'content', 'products'),
        path.join(__dirname, 'assets', 'data', 'products.json')
    );

    const projects = consolidateCollection(
        path.join(__dirname, 'content', 'projects'),
        path.join(__dirname, 'assets', 'data', 'projects.json')
    );

    // Videos: consolidate then normalize all YouTube URLs to embed format
    let videos = consolidateCollection(
        path.join(__dirname, 'content', 'videos'),
        path.join(__dirname, 'assets', 'data', 'videos.json')
    );
    videos = videos.map(v => ({
        ...v,
        video_url: normalizeYouTubeUrl(v.video_url)
    }));
    // Re-write with normalized URLs
    const videosDestFile = path.join(__dirname, 'assets', 'data', 'videos.json');
    require('fs').writeFileSync(videosDestFile, JSON.stringify(videos, null, 2));
    console.log(`Video URLs normalized and written to ${videosDestFile}`);

    const branches = consolidateCollection(
        path.join(__dirname, 'content', 'branches'),
        path.join(__dirname, 'assets', 'data', 'branches.json')
    );

    // 1.5. Generate Homepage, Products, and Projects pages from templates with dynamic settings
    const homepageTemplatePath = path.join(__dirname, 'templates', 'index-template.html');
    const productsTemplatePath = path.join(__dirname, 'templates', 'products-template.html');
    const projectsTemplatePath = path.join(__dirname, 'templates', 'projects-template.html');
    
    const homepageDataPath = path.join(__dirname, 'content', 'homepage.json');
    const settingsDataPath = path.join(__dirname, 'content', 'settings.json');
    const pagesDataPath = path.join(__dirname, 'content', 'pages.json');

    if (fs.existsSync(settingsDataPath)) {
        try {
            const settingsRaw = fs.readFileSync(settingsDataPath, 'utf8');
            const settings = JSON.parse(settingsRaw);
            const cleanWa = settings.contact_whatsapp ? settings.contact_whatsapp.replace(/[^0-9]/g, '') : '';

            // Load pages.json for Products & Projects page headers
            let pagesData = {};
            if (fs.existsSync(pagesDataPath)) {
                try {
                    pagesData = JSON.parse(fs.readFileSync(pagesDataPath, 'utf8'));
                } catch (e) {
                    console.warn('Could not parse pages.json:', e);
                }
            }

            // Inject global settings variables into template file string helper
            const compileLayout = (templateHtml) => {
                let out = templateHtml;
                // Inject settings
                Object.keys(settings).forEach(key => {
                    const regex = new RegExp(`{{${key}}}`, 'g');
                    out = out.replace(regex, settings[key] || '');
                });
                out = out.replace(/{{contact_whatsapp_clean}}/g, cleanWa);
                // Inject pages data
                Object.keys(pagesData).forEach(key => {
                    const regex = new RegExp(`{{${key}}}`, 'g');
                    out = out.replace(regex, pagesData[key] || '');
                });
                return out;
            };

            // Compile Homepage index.html
            if (fs.existsSync(homepageTemplatePath) && fs.existsSync(homepageDataPath)) {
                console.log('Generating homepage (index.html) from template...');
                const homepageRaw = fs.readFileSync(homepageDataPath, 'utf8');
                const homepageData = JSON.parse(homepageRaw);
                let html = fs.readFileSync(homepageTemplatePath, 'utf8');

                // Dynamic Services HTML Builder
                let servicesHtml = '';
                if (homepageData.services && homepageData.services.length > 0) {
                    homepageData.services.forEach((service, index) => {
                        const num = String(index + 1).padStart(2, '0');
                        servicesHtml += `
                    <!-- Expertise ${index + 1} -->
                    <div class="expertise-item reveal-element">
                        <div class="expertise-num">${num}</div>
                        <div class="expertise-body">
                            <h3 class="expertise-name">${service.title}</h3>
                            <p class="expertise-desc">${service.desc}</p>
                        </div>
                        <div class="expertise-accent"></div>
                    </div>`;
                    });
                } else {
                    servicesHtml = '<p style="text-align: center; font-weight: 300; opacity: 0.5; padding: 40px 0;">Belum ada detail layanan.</p>';
                }

                // Dynamic Featured Projects HTML Builder
                let featuredProjectsHtml = '';
                if (homepageData.featured_projects && homepageData.featured_projects.length > 0) {
                    homepageData.featured_projects.forEach((proj, index) => {
                        const isTall = index === 0 ? ' masonry-tall' : '';
                        featuredProjectsHtml += `
                    <!-- Project ${index + 1} -->
                    <div class="project-item reveal-element${isTall}">
                        <div class="project-image-wrapper">
                            <img src="${proj.image}" alt="${proj.name}" class="project-image">
                            <div class="project-overlay">
                                <div class="project-meta">
                                    <h3 class="project-name">${proj.name}</h3>
                                    <span class="project-location">${proj.location}</span>
                                </div>
                            </div>
                        </div>
                    </div>`;
                    });
                } else {
                    featuredProjectsHtml = '<p style="text-align: center; font-weight: 300; opacity: 0.5; padding: 40px 0;">Belum ada project unggulan.</p>';
                }

                // First replace flat homepage keys
                Object.keys(homepageData).forEach(key => {
                    if (key !== 'services' && key !== 'featured_projects') {
                        const regex = new RegExp(`{{${key}}}`, 'g');
                        html = html.replace(regex, homepageData[key] || '');
                    }
                });

                // Replace placeholders
                html = html.replace(/{{services_html}}/g, servicesHtml);
                html = html.replace(/{{featured_projects_html}}/g, featuredProjectsHtml);

                // Run final layouts config mapping
                html = compileLayout(html);

                fs.writeFileSync(path.join(__dirname, 'index.html'), html);
                console.log('Successfully generated index.html with dynamic services, featured projects & footer');
            }

            // Compile Products page
            if (fs.existsSync(productsTemplatePath)) {
                console.log('Generating products catalog page...');
                let html = fs.readFileSync(productsTemplatePath, 'utf8');
                html = compileLayout(html);
                ensureDir(path.join(__dirname, 'products'));
                fs.writeFileSync(path.join(__dirname, 'products', 'index.html'), html);
                console.log('Successfully generated products/index.html');
            }

            // Compile Projects page
            if (fs.existsSync(projectsTemplatePath)) {
                console.log('Generating projects page...');
                let html = fs.readFileSync(projectsTemplatePath, 'utf8');
                html = compileLayout(html);
                ensureDir(path.join(__dirname, 'projects'));
                fs.writeFileSync(path.join(__dirname, 'projects', 'index.html'), html);
                console.log('Successfully generated projects/index.html');
            }

            // 2. Generate Branch Detail Pages
            const branchTemplatePath = path.join(__dirname, 'templates', 'branch-template.html');
            if (fs.existsSync(branchTemplatePath)) {
                console.log('Generating branch pages from template...');
                const branchTemplate = fs.readFileSync(branchTemplatePath, 'utf8');

                branches.forEach(branch => {
                    console.log(`Generating branch page for: ${branch.name} (${branch.slug})...`);
                    
                    // Format local gallery HTML
                    let galleryHtml = '';
                    if (branch.local_gallery && branch.local_gallery.length > 0) {
                        branch.local_gallery.forEach(imgUrl => {
                            galleryHtml += `
                            <div style="border-radius: 16px; overflow: hidden; aspect-ratio: 4/3; box-shadow: 0 10px 30px rgba(0,0,0,0.03); transition: transform 0.3s ease;" class="gallery-item">
                                <img src="${imgUrl}" alt="Proyek ${branch.name}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease;">
                            </div>`;
                        });
                    } else {
                        galleryHtml = '<p style="text-align: center; font-weight: 300; opacity: 0.5; grid-column: span 3; padding: 40px 0;">Gallery project belum tersedia.</p>';
                    }

                    // First map the branch specific placeholders
                    let html = branchTemplate
                        .replace(/{{name}}/g, branch.name || '')
                        .replace(/{{slug}}/g, branch.slug || '')
                        .replace(/{{photo}}/g, branch.photo || '../../assets/hero_ceiling.png')
                        .replace(/{{address}}/g, branch.address || '')
                        .replace(/{{maps_embed_url}}/g, branch.maps_embed_url || '')
                        .replace(/{{maps_link}}/g, branch.maps_link || '#')
                        .replace(/{{whatsapp_number}}/g, branch.whatsapp_number ? branch.whatsapp_number.replace('+', '') : '')
                        .replace(/{{whatsapp_text}}/g, encodeURIComponent(branch.whatsapp_text || ''))
                        .replace(/{{contact_person}}/g, branch.contact_person || '')
                        .replace(/{{seo_title}}/g, branch.seo_title || branch.name)
                        .replace(/{{meta_description}}/g, branch.meta_description || '')
                        .replace(/{{local_gallery_html}}/g, galleryHtml);

                    // Compile static footer details using the settings.json
                    html = compileLayout(html);

                    // Write output file in /branches/{slug}/index.html
                    const branchOutDir = path.join(__dirname, 'branches', branch.slug);
                    ensureDir(branchOutDir);
                    fs.writeFileSync(path.join(branchOutDir, 'index.html'), html);
                    console.log(`Generated: branches/${branch.slug}/index.html`);
                });
            } else {
                console.error('Branch template not found! Skipping branch page generation.');
            }

        } catch (err) {
            console.error('Error during site layout compilation:', err);
        }
    } else {
        console.error('settings.json not found! Cannot compile layouts.');
    }

    console.log('--- BUILD COMPLETE ---');
};

runBuild();
