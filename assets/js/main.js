// Uccello Labs · CODIR Dashboard
// Renderer client-side : lit site.json et génère le DOM.

const STATE = {
  site: null,
  currentPage: null,
};

// ─── Utils ───────────────────────────────────────────────────────────────────
const $ = (sel, root = document) => root.querySelector(sel);

const h = (tag, attrs, ...children) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k.startsWith('data-')) el.setAttribute(k, v);
    else el.setAttribute(k, v);
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    el.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
};

const resolvePath = (obj, path) => {
  if (!path) return null;
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
};

const fmtPct = (n) => (typeof n === 'number' ? `${Math.round(n)}%` : n);
const fmtCurrency = (n) => (typeof n === 'number' ? `${n.toLocaleString('fr-FR')} €` : n);

const STATUS_LABEL = {
  on_track: { label: 'En cours', cls: 'badge--ok' },
  at_risk: { label: 'À risque', cls: 'badge--warn' },
  off_track: { label: 'Bloqué', cls: 'badge--danger' },
  done: { label: 'Atteint', cls: 'badge--ok' },
  active: { label: 'Actif', cls: 'badge--ok' },
  parked: { label: 'Parquée', cls: 'badge--neutral' },
  pending: { label: 'En attente', cls: 'badge--neutral' },
  open: { label: 'À trancher', cls: 'badge--warn' },
  saturated: { label: 'Saturée', cls: 'badge--warn' },
  tbd: { label: 'TBD', cls: 'badge--neutral' },
};

const renderStatus = (status) => {
  const meta = STATUS_LABEL[status] || { label: status || 'TBD', cls: 'badge--neutral' };
  return h('span', { class: `badge ${meta.cls}` }, meta.label);
};

// ─── Tokens injection ────────────────────────────────────────────────────────
const injectTokens = (tokens) => {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(tokens || {})) {
    root.style.setProperty(`--${key}`, value);
  }
};

const injectFonts = (fonts) => {
  if (!fonts?.primary) return;
  const { family, weights, source } = fonts.primary;
  if (source === 'google') {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    const w = (weights || [400, 600]).join(';');
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${w}&display=swap`;
    document.head.appendChild(link);
    document.documentElement.style.setProperty('--font-family', `'${family}', system-ui, sans-serif`);
  }
};

// ─── Section renderers ───────────────────────────────────────────────────────
const sectionRenderers = {};

sectionRenderers.hero = (props) =>
  h('section', { class: `hero hero--${props.variant || 'solid'}` },
    h('div', { class: 'container' },
      props.eyebrow && h('p', { class: 'hero__eyebrow' }, props.eyebrow),
      props.title && h('h1', { class: 'hero__title', html: props.title }),
      props.description && h('p', { class: 'hero__desc' }, props.description),
      props.meta && h('div', { class: 'hero__meta' },
        ...props.meta.map(m => h('span', { class: 'hero__meta-item' }, `${m.icon || ''} ${m.label}`))
      )
    )
  );

const renderSectionHeader = (header) =>
  header ? h('div', { class: 'section__header' },
    header.eyebrow && h('p', { class: 'section__eyebrow' }, header.eyebrow),
    header.title && h('h2', { class: 'section__title' }, header.title),
    header.description && h('p', { class: 'section__desc' }, header.description)
  ) : null;

sectionRenderers['kpi-grid'] = (props, data) => {
  const items = resolvePath(data, props.data_path) || [];
  const variant = props.variant || 'default';
  return h('section', { class: `kpi-section kpi-section--${variant}` },
    h('div', { class: 'container' },
      renderSectionHeader(props.header),
      h('div', { class: `kpi-grid kpi-grid--${variant}` },
        ...items.map(kpi =>
          h('article', { class: 'kpi-card' },
            kpi.icon && h('div', { class: 'kpi-card__icon' }, kpi.icon),
            h('p', { class: 'kpi-card__label' }, kpi.label),
            h('p', { class: 'kpi-card__value' }, kpi.value),
            kpi.delta && h('p', { class: `kpi-card__delta kpi-card__delta--${kpi.trend || 'flat'}` }, kpi.delta),
            kpi.note && h('p', { class: 'kpi-card__note' }, kpi.note),
            kpi.source && h('p', { class: 'kpi-card__source' }, `Source : ${kpi.source}`)
          )
        )
      )
    )
  );
};

sectionRenderers['okr-cycle'] = (props, data) => {
  const cycle = resolvePath(data, props.data_path);
  if (!cycle) return null;
  return h('section', { class: 'okr-cycle' },
    h('div', { class: 'container' },
      renderSectionHeader(props.header),
      h('div', { class: 'okr-cycle__head' },
        h('div', { class: 'okr-cycle__meta' },
          h('span', { class: 'okr-cycle__code' }, cycle.code),
          h('span', { class: 'okr-cycle__dates' }, `${cycle.start_date} → ${cycle.end_date}`),
          h('span', { class: 'okr-cycle__progress' }, `Semaine ${cycle.current_week_index} / ${cycle.total_weeks}`)
        ),
        h('div', { class: 'okr-cycle__bar' },
          h('div', { class: 'okr-cycle__bar-fill', style: `width:${(cycle.current_week_index / cycle.total_weeks) * 100}%` })
        )
      ),
      h('div', { class: 'okr-cycle__objective' },
        h('p', { class: 'okr-cycle__objective-label' }, 'Objectif majeur'),
        h('p', { class: 'okr-cycle__objective-text' }, cycle.objective),
        cycle.model && h('p', { class: 'okr-cycle__model' }, `Modèle : ${cycle.model}`)
      ),
      h('div', { class: 'kr-grid' },
        ...(cycle.key_results || []).map(kr => {
          const pct = (typeof kr.target === 'number' && kr.target > 0)
            ? Math.min(100, Math.round((Number(kr.current) || 0) / kr.target * 100))
            : 0;
          return h('article', { class: 'kr-card' },
            h('div', { class: 'kr-card__head' },
              h('span', { class: 'kr-card__id' }, kr.id),
              renderStatus(kr.status)
            ),
            h('h3', { class: 'kr-card__label' }, kr.label),
            kr.definition && h('p', { class: 'kr-card__def' }, kr.definition),
            h('div', { class: 'kr-card__progress' },
              h('div', { class: 'kr-card__progress-bar' },
                h('div', { class: 'kr-card__progress-fill', style: `width:${pct}%` })
              ),
              h('p', { class: 'kr-card__progress-text' }, `${kr.current} / ${kr.target} ${kr.unit || ''}`)
            ),
            h('div', { class: 'kr-card__meta' },
              kr.owner && h('span', null, `👤 ${kr.owner}`)
            ),
            (kr.candidates && kr.candidates.length > 0) && h('div', { class: 'kr-card__list' },
              h('p', { class: 'kr-card__list-label' }, 'Candidats :'),
              h('ul', null, ...kr.candidates.map(c => h('li', null, c)))
            ),
            (kr.blockers && kr.blockers.length > 0) && h('div', { class: 'kr-card__list kr-card__list--warn' },
              h('p', { class: 'kr-card__list-label' }, 'Bloqueurs :'),
              h('ul', null, ...kr.blockers.map(b => h('li', null, b)))
            )
          );
        })
      ),
      (cycle.notes && cycle.notes.length > 0) && h('div', { class: 'okr-cycle__notes' },
        h('p', { class: 'okr-cycle__notes-label' }, 'Notes de cadrage'),
        h('ul', null, ...cycle.notes.map(n => h('li', null, n)))
      )
    )
  );
};

sectionRenderers['okr-week'] = (props, data) => {
  const week = resolvePath(data, props.data_path);
  if (!week) return null;
  return h('section', { class: 'okr-week' },
    h('div', { class: 'container' },
      renderSectionHeader(props.header),
      h('div', { class: 'okr-week__head' },
        h('span', { class: 'okr-week__code' }, week.code),
        h('span', { class: 'okr-week__dates' }, `${week.start_date} → ${week.end_date}`),
        h('span', { class: 'okr-week__days' }, `Jours actifs : ${(week.active_days || []).join(', ')}`)
      ),
      h('p', { class: 'okr-week__objective' }, week.objective),
      h('div', { class: 'kr-grid' },
        ...(week.key_results || []).map(kr =>
          h('article', { class: 'kr-card kr-card--week' },
            h('div', { class: 'kr-card__head' },
              h('span', { class: 'kr-card__id' }, kr.id),
              renderStatus(kr.status)
            ),
            h('h3', { class: 'kr-card__label' }, kr.label),
            kr.detail && h('p', { class: 'kr-card__def' }, kr.detail),
            h('p', { class: 'kr-card__progress-text' }, `${kr.current} / ${kr.target} ${kr.unit || ''} · sert ${kr.cycle_link || ''}`)
          )
        )
      ),
      (week.reported_next_week && week.reported_next_week.length > 0) && h('div', { class: 'okr-week__reported' },
        h('p', { class: 'okr-week__reported-label' }, 'Reporté en W21 :'),
        h('ul', null, ...week.reported_next_week.map(r => h('li', null, r)))
      )
    )
  );
};

sectionRenderers['missions-list'] = (props, data) => {
  const missions = resolvePath(data, props.data_path);
  if (!missions) return null;
  return h('section', { class: 'missions' },
    h('div', { class: 'container' },
      renderSectionHeader(props.header),
      h('div', { class: 'missions__day' },
        h('p', { class: 'missions__day-label' }, missions.today_label || missions.today_date)
      ),
      h('ul', { class: 'missions__list' },
        ...(missions.items || []).map(m =>
          h('li', { class: `mission ${m.done ? 'mission--done' : ''} ${m.off_kr ? 'mission--off' : ''}` },
            h('span', { class: 'mission__check', html: m.done ? '☑' : '☐' }),
            h('span', { class: 'mission__time' }, m.time || ''),
            h('span', { class: 'mission__label' }, m.label),
            m.duration_min && h('span', { class: 'mission__duration' }, `${m.duration_min} min`),
            m.kr && h('span', { class: 'mission__kr' }, `← sert ${m.kr}`),
            m.off_kr && h('span', { class: 'mission__kr mission__kr--off' }, 'hors KR')
          )
        )
      )
    )
  );
};

sectionRenderers['finance-panel'] = (props, data) => {
  const fin = resolvePath(data, props.data_path);
  if (!fin) return null;
  const total = fin.mrr_total || 0;
  return h('section', { class: 'finance' },
    h('div', { class: 'container' },
      renderSectionHeader(props.header),
      h('div', { class: 'finance__head' },
        h('div', { class: 'finance__mrr' },
          h('p', { class: 'finance__mrr-label' }, fin.mrr_currency_note ? `MRR consolidé (${fin.mrr_currency_note})` : 'MRR consolidé'),
          h('p', { class: 'finance__mrr-value' }, fmtCurrency(total)),
          h('p', { class: 'finance__mrr-asof' }, `Au ${fin.as_of_date || ''}`)
        ),
        h('div', { class: 'finance__breakdown' },
          h('p', { class: 'finance__breakdown-label' }, 'Répartition MRR par offre'),
          h('ul', { class: 'finance__breakdown-list' },
            ...(fin.mrr_breakdown || []).map(b => {
              const pct = total > 0 ? Math.round((b.value / total) * 100) : 0;
              return h('li', { class: 'finance__breakdown-item' },
                h('div', { class: 'finance__breakdown-row' },
                  h('span', { class: 'finance__breakdown-name' }, b.label),
                  h('span', { class: 'finance__breakdown-value' }, `${fmtCurrency(b.value)} (${pct}%)`)
                ),
                h('div', { class: 'finance__breakdown-bar' },
                  h('div', { class: 'finance__breakdown-fill', style: `width:${pct}%` })
                )
              );
            })
          )
        )
      ),
      h('div', { class: 'finance__metrics' },
        ...['revenue_month_minus_1', 'revenue_ytd', 'cash_position', 'monthly_inflow', 'monthly_burn', 'net_cashflow', 'runway_months'].map(key => {
          const m = fin[key];
          if (!m) return null;
          return h('div', { class: 'finance__metric' },
            h('p', { class: 'finance__metric-label' }, m.label),
            h('p', { class: 'finance__metric-value' }, typeof m.value === 'number' ? fmtCurrency(m.value) : m.value),
            m.source && h('p', { class: 'finance__metric-source' }, m.source)
          );
        })
      ),
      (fin.open_invoices && fin.open_invoices.length > 0) && h('div', { class: 'finance__invoices' },
        h('p', { class: 'finance__invoices-label' }, 'Créances clients à recouvrer'),
        h('ul', { class: 'finance__invoices-list' },
          ...fin.open_invoices.map(inv =>
            h('li', { class: 'finance__invoices-item' },
              h('span', { class: 'finance__invoices-name' }, inv.label),
              h('span', { class: 'finance__invoices-value' }, typeof inv.value === 'number' ? fmtCurrency(inv.value) : inv.value),
              inv.source && h('span', { class: 'finance__invoices-source' }, inv.source)
            )
          )
        )
      ),
      (fin.notes && fin.notes.length > 0) && h('div', { class: 'finance__notes' },
        h('ul', null, ...fin.notes.map(n => h('li', null, n)))
      )
    )
  );
};

sectionRenderers['projects-status'] = (props, data) => {
  const projects = resolvePath(data, props.data_path) || [];
  return h('section', { class: 'projects' },
    h('div', { class: 'container' },
      renderSectionHeader(props.header),
      h('div', { class: 'projects__grid' },
        ...projects.map(p =>
          h('article', { class: `project-card project-card--${p.status}` },
            h('div', { class: 'project-card__head' },
              h('h3', { class: 'project-card__name' }, p.name),
              renderStatus(p.status)
            ),
            p.tagline && h('p', { class: 'project-card__tagline' }, p.tagline),
            h('div', { class: 'project-card__row' },
              h('div', { class: 'project-card__cell' },
                h('p', { class: 'project-card__cell-label' }, 'Owner'),
                h('p', { class: 'project-card__cell-value' }, p.owner || 'TBD')
              ),
              h('div', { class: 'project-card__cell' },
                h('p', { class: 'project-card__cell-label' }, 'Stade'),
                h('p', { class: 'project-card__cell-value' }, p.stage || 'TBD')
              ),
              h('div', { class: 'project-card__cell' },
                h('p', { class: 'project-card__cell-label' }, 'MRR'),
                h('p', { class: 'project-card__cell-value' }, fmtCurrency(p.mrr || 0))
              ),
              h('div', { class: 'project-card__cell' },
                h('p', { class: 'project-card__cell-label' }, 'Clients'),
                h('p', { class: 'project-card__cell-value' }, p.clients_count || 0)
              )
            ),
            (p.kr_links && p.kr_links.length > 0) && h('div', { class: 'project-card__krs' },
              ...p.kr_links.map(k => h('span', { class: 'project-card__kr' }, k))
            ),
            (p.next_milestones && p.next_milestones.length > 0) && h('div', { class: 'project-card__list' },
              h('p', { class: 'project-card__list-label' }, 'Prochains jalons'),
              h('ul', null, ...p.next_milestones.map(m => h('li', null, `${m.date} : ${m.label}`)))
            ),
            (p.risks && p.risks.length > 0) && h('div', { class: 'project-card__list project-card__list--warn' },
              h('p', { class: 'project-card__list-label' }, 'Risques'),
              h('ul', null, ...p.risks.map(r => h('li', null, r)))
            )
          )
        )
      )
    )
  );
};

sectionRenderers['team-load'] = (props, data) => {
  const team = resolvePath(data, props.data_path) || [];
  const compact = props.variant === 'compact';
  return h('section', { class: `team ${compact ? 'team--compact' : ''}` },
    h('div', { class: 'container' },
      renderSectionHeader(props.header),
      h('div', { class: 'team__grid' },
        ...team.map(p => {
          const load = typeof p.load_current_pct === 'number' ? p.load_current_pct : null;
          return h('article', { class: `team-card team-card--${p.load_status || 'tbd'}` },
            h('div', { class: 'team-card__head' },
              h('div', null,
                h('h3', { class: 'team-card__name' }, p.name),
                h('p', { class: 'team-card__role' }, p.role)
              ),
              renderStatus(p.load_status)
            ),
            h('div', { class: 'team-card__load' },
              h('p', { class: 'team-card__load-label' }, 'Charge actuelle'),
              load != null
                ? h('div', { class: 'team-card__load-bar' },
                    h('div', { class: 'team-card__load-fill', style: `width:${Math.min(100, load)}%` }),
                    h('span', { class: 'team-card__load-pct' }, fmtPct(load))
                  )
                : h('p', { class: 'team-card__load-tbd' }, 'TBD : à renseigner')
            ),
            p.current_focus && h('div', { class: 'team-card__focus' },
              h('p', { class: 'team-card__focus-label' }, 'Focus du moment'),
              h('p', { class: 'team-card__focus-text' }, p.current_focus)
            ),
            (!compact && p.scope && p.scope.length > 0) && h('div', { class: 'team-card__list' },
              h('p', { class: 'team-card__list-label' }, 'Périmètre'),
              h('ul', null, ...p.scope.map(s => h('li', null, s)))
            ),
            (!compact && p.single_point_of_failure && p.single_point_of_failure.length > 0) && h('div', { class: 'team-card__list team-card__list--warn' },
              h('p', { class: 'team-card__list-label' }, 'Single point of failure'),
              h('ul', null, ...p.single_point_of_failure.map(s => h('li', null, s)))
            ),
            (!compact && p.working_days) && h('p', { class: 'team-card__days' }, `Jours travaillés : ${(p.working_days || []).join(', ')}`)
          );
        })
      )
    )
  );
};

sectionRenderers['agenda-list'] = (props, data) => {
  const agenda = resolvePath(data, props.data_path);
  if (!agenda) return null;
  const showAll = props.variant !== 'this_week';
  const decisions = agenda.open_decisions || [];
  const milestones = agenda.next_milestones || [];
  return h('section', { class: 'agenda' },
    h('div', { class: 'container' },
      renderSectionHeader(props.header),
      h('div', { class: 'agenda__columns' },
        h('div', { class: 'agenda__col' },
          h('h3', { class: 'agenda__col-title' }, 'Décisions ouvertes'),
          h('ul', { class: 'agenda__list' },
            ...decisions.map(d =>
              h('li', { class: 'agenda__item' },
                h('div', { class: 'agenda__item-head' },
                  h('span', { class: 'agenda__item-id' }, d.id),
                  renderStatus(d.status),
                  d.due && h('span', { class: 'agenda__item-due' }, `Échéance ${d.due}`)
                ),
                h('p', { class: 'agenda__item-label' }, d.label),
                d.owner && h('p', { class: 'agenda__item-owner' }, `Owner : ${d.owner}`),
                d.context && h('p', { class: 'agenda__item-context' }, d.context)
              )
            )
          )
        ),
        showAll && h('div', { class: 'agenda__col' },
          h('h3', { class: 'agenda__col-title' }, 'Prochains jalons'),
          h('ul', { class: 'agenda__list' },
            ...milestones.map(m =>
              h('li', { class: 'agenda__item agenda__item--milestone' },
                h('p', { class: 'agenda__item-date' }, m.date),
                h('p', { class: 'agenda__item-label' }, m.label)
              )
            )
          )
        )
      )
    )
  );
};

// ─── Layout ──────────────────────────────────────────────────────────────────
const renderNav = (site) => {
  const nav = site.nav;
  return h('nav', { class: `nav ${nav.sticky ? 'nav--sticky' : ''}` },
    h('div', { class: 'container' },
      h('div', { class: 'nav__inner' },
        h('a', { href: '#index', class: 'nav__logo' },
          site.branding.logo?.src
            ? h('img', { src: site.branding.logo.src, alt: site.branding.logo.alt || '', style: `height:${site.branding.logo.height || 32}px;width:auto;display:block;` })
            : h('span', null, site.site.name)
        ),
        h('ul', { class: 'nav__links' },
          ...nav.items.map(item =>
            h('li', null,
              h('a', { href: `#${item.page}`, 'data-page': item.page, class: STATE.currentPage === item.page ? 'active' : '' }, item.label)
            )
          )
        )
      )
    )
  );
};

const renderFooter = (site) => {
  const f = site.footer;
  return h('footer', { class: 'footer' },
    h('div', { class: 'container' },
      h('div', { class: 'footer__inner' },
        h('div', { class: 'footer__left' },
          f.left?.brand && h('p', { class: 'footer__brand', html: f.left.brand }),
          f.left?.tagline && h('p', { class: 'footer__tagline' }, f.left.tagline)
        ),
        h('div', { class: 'footer__right' },
          f.right?.badge && h('p', { class: 'footer__badge' }, f.right.badge),
          ...(f.right?.notes || []).map(n => h('p', { class: 'footer__note' }, n))
        )
      )
    )
  );
};

const renderPage = (page) => {
  const main = h('main', { class: 'page' });
  for (const section of page.sections || []) {
    const renderer = sectionRenderers[section.type];
    if (!renderer) {
      main.appendChild(h('section', { class: 'section--unknown' },
        h('div', { class: 'container' },
          h('p', null, `[Section non implémentée : ${section.type}]`)
        )
      ));
      continue;
    }
    const node = renderer(section.props || {}, STATE.site);
    if (node) main.appendChild(node);
  }
  return main;
};

const renderApp = () => {
  const site = STATE.site;
  const slug = STATE.currentPage;
  const page = site.pages.find(p => p.slug === slug) || site.pages.find(p => p.is_home) || site.pages[0];
  STATE.currentPage = page.slug;
  document.title = `${site.site.name} · ${page.title}`;
  const app = $('#app');
  app.removeAttribute('data-loading');
  app.replaceChildren(
    renderNav(site),
    renderPage(page),
    renderFooter(site),
  );
  window.scrollTo({ top: 0, behavior: 'instant' });
};

// ─── Routing (hash-based) ────────────────────────────────────────────────────
const getPageFromHash = () => {
  const slug = (window.location.hash || '').replace(/^#/, '').trim();
  return slug || null;
};

const handleRoute = () => {
  STATE.currentPage = getPageFromHash();
  renderApp();
};

// ─── Boot ────────────────────────────────────────────────────────────────────
const boot = async () => {
  try {
    const res = await fetch('site.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const site = await res.json();
    STATE.site = site;
    injectTokens(site.branding?.tokens);
    injectFonts(site.branding?.fonts);
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
  } catch (err) {
    console.error('Boot error:', err);
    const app = $('#app');
    app.removeAttribute('data-loading');
    app.replaceChildren(
      h('div', { class: 'boot boot--error' },
        h('p', null, 'Impossible de charger site.json.'),
        h('pre', null, String(err))
      )
    );
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
