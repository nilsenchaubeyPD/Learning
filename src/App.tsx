import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import {
  DEFAULT_TEMPLATE,
  TABS,
  clampStepper,
  createTemplateState,
  loadPersistedPanel,
  savePersistedPanel,
  isSettingVisible,
  pickSharedState,
  pickTemplateState,
  resolveActiveTab,
  stepValue,
  visibleTabs,
  type SettingDef,
  type SettingState,
  type SettingValue,
  type TabDef,
  type TemplateId,
} from './settings';

import { ReviewPage } from './ReviewPage';
import mailIcon from './assets/icons/mail-02.svg';
import linkIcon from './assets/icons/link-02.svg';
import copyIcon from './assets/icons/copy-02.svg';
import checkIcon from './assets/icons/check.svg';
import starsIcon from './assets/icons/stars-02.svg';

/** No auth source in this workspace. Internal shows all five sections. */
const VIEWER_IS_INTERNAL = true;

const LAYOUTS = [
  { path: '/', label: 'V1', className: '' },
  { path: '/v2', label: 'V2', className: 'is-stacked' },
  { path: '/v3', label: 'V3', className: 'is-cards' },
] as const;

function resolveLayout(pathname: string) {
  const path = pathname.replace(/\/+$/, '') || '/';
  return LAYOUTS.find((layout) => layout.path === path) ?? LAYOUTS[0];
}

interface PanelContextValue {
  isInternal: boolean;
  state: SettingState;
  update: (id: string, value: SettingValue) => void;
  focusInput: (id: string) => void;
  openTip: string | null;
  pinnedTip: string | null;
  showTip: (id: string) => void;
  hideTip: (id: string) => void;
  toggleTip: (id: string) => void;
  dismissTip: () => void;
  adjust: (id: string, delta: number, min: number, max: number) => void;
  validationErrors: Record<string, string>;
  clearValidationError: (id: string) => void;
}

const PanelContext = createContext<PanelContextValue | null>(null);

function usePanel(): PanelContextValue {
  const value = useContext(PanelContext);
  if (!value) throw new Error('Advanced options controls must render inside the panel.');
  return value;
}

export function App() {
  return (
    <ReviewPage>
      <AdvancedOptions isInternal={VIEWER_IS_INTERNAL} />
    </ReviewPage>
  );
}

export function AdvancedOptions({ isInternal }: { isInternal: boolean }) {
  const tabs = useMemo(() => visibleTabs(TABS, isInternal), [isInternal]);
  const persisted = useMemo(() => loadPersistedPanel(), []);
  const [activeId, setActiveId] = useState(persisted.activeId);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>(DEFAULT_TEMPLATE);
  const templateRef = useRef<TemplateId>(DEFAULT_TEMPLATE);
  const [templateStates, setTemplateStates] = useState(persisted.templates);
  const [state, setState] = useState<SettingState>(() => ({
    ...persisted.shared,
    ...persisted.templates[DEFAULT_TEMPLATE],
  }));
  const [openTip, setOpenTip] = useState<string | null>(null);
  const [pinnedTip, setPinnedTip] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const safeId = resolveActiveTab(tabs, activeId);

  useEffect(() => {
    if (safeId !== activeId) setActiveId(safeId);
  }, [safeId, activeId]);

  useEffect(() => {
    savePersistedPanel({
      version: 6,
      activeId: safeId,
      shared: pickSharedState(state),
      templates: { ...templateStates, [selectedTemplate]: pickTemplateState(state) },
    });
  }, [selectedTemplate, templateStates, safeId, state]);

  useEffect(() => {
    if (!openTip) return undefined;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-tooltip-root]')) return;
      setPinnedTip(null);
      setOpenTip(null);
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setPinnedTip(null);
      setOpenTip(null);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openTip]);

  const activeTab = tabs.find((tab) => tab.id === safeId) ?? tabs[0];

  const update = (id: string, value: SettingValue) => {
    if (id === 'ip-addresses' || (id === 'ip-restriction' && value === 'No')) {
      setValidationErrors((current) => {
        if (!current['ip-addresses']) return current;
        const next = { ...current };
        delete next['ip-addresses'];
        return next;
      });
    }
    setState((current) => {
      const next = { ...current, [id]: value };
      if (id === 'camera-monitoring' && value === 'No') {
        next['auto-terminate-camera'] = 'No';
      }
      return next;
    });
  };

  const focusInput = (id: string) => {
    let attempts = 0;
    const focusWhenReady = () => {
      const input = document.querySelector<HTMLInputElement>(`#control-${id}`);
      if (!input) {
        attempts += 1;
        if (attempts < 3) requestAnimationFrame(focusWhenReady);
        return;
      }

      input.focus();
      if (['text', 'search', 'tel', 'url', 'password'].includes(input.type)) {
        const end = input.value.length;
        input.setSelectionRange(end, end);
      }
      if (input.type === 'datetime-local') {
        try {
          input.showPicker?.();
        } catch {
          // Focus is still applied when the browser disallows programmatic picker opening.
        }
      }
    };
    requestAnimationFrame(focusWhenReady);
  };

  const clearValidationError = (id: string) => {
    setValidationErrors((current) => {
      if (!(id in current)) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const submit = () => {
    const errors: Record<string, string> = {};
    const ips = state['ip-addresses'];
    if (state['ip-restriction'] === 'Yes' && (!Array.isArray(ips) || ips.length === 0)) {
      errors['ip-addresses'] = 'At least one IP address is required.';
    }
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      setActiveId('proctoring');
      requestAnimationFrame(() => document.querySelector<HTMLInputElement>('#control-ip-addresses')?.focus());
    }
  };

  const adjust = (id: string, delta: number, min: number, max: number) => {
    setState((current) => {
      const previous = current[id];
      const raw = typeof previous === 'string' ? previous : String(min);
      return { ...current, [id]: stepValue(raw, delta, min, max) };
    });
  };

  const showTip = (id: string) => {
    setOpenTip(id);
    setPinnedTip((pin) => (pin && pin !== id ? null : pin));
  };
  const hideTip = (id: string) => {
    if (pinnedTip === id) return;
    setOpenTip((current) => (current === id ? null : current));
  };
  const toggleTip = (id: string) => {
    if (pinnedTip === id) {
      setPinnedTip(null);
      setOpenTip(null);
      return;
    }
    setPinnedTip(id);
    setOpenTip(id);
  };
  const dismissTip = () => {
    setPinnedTip(null);
    setOpenTip(null);
  };

  /** Each template keeps its own configuration: park the current one, restore the next. */
  const selectTemplate = (id: TemplateId) => {
    const previous = templateRef.current;
    if (previous === id) return;
    const parked = pickTemplateState(state);
    const restored = templateStates[id] ?? createTemplateState(id);
    templateRef.current = id;
    setTemplateStates((all) => ({ ...all, [previous]: parked }));
    setSelectedTemplate(id);
    setState((current) => ({ ...current, ...restored }));
  };

  const onNavKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const key = event.key;
    if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(key)) return;
    event.preventDefault();
    const index = tabs.findIndex((tab) => tab.id === activeTab?.id);
    let next = index;
    if (key === 'ArrowDown' || key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (key === 'ArrowUp' || key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (key === 'Home') next = 0;
    if (key === 'End') next = tabs.length - 1;
    const tab = tabs[next];
    if (!tab) return;
    setActiveId(tab.id);
    dismissTip();
    tabRefs.current[tab.id]?.focus();
  };

  if (!activeTab) return null;

  const layout = resolveLayout(window.location.pathname);

  const context: PanelContextValue = {
    isInternal,
    state,
    update,
    focusInput,
    openTip,
    pinnedTip,
    showTip,
    hideTip,
    toggleTip,
    dismissTip,
    adjust,
    validationErrors,
    clearValidationError,
  };

  return (
    <PanelContext.Provider value={context}>
      <form
        id="advanced-options-form"
        className={`shell${layout.className ? ` ${layout.className}` : ''}`}
        aria-label="Advanced options"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <aside className="side">
          <h1>Advanced Options</h1>
          <nav className="layout-switcher" aria-label="Layout versions">
            {LAYOUTS.map((item) => {
              const current = item.path === layout.path;
              return (
                <a
                  key={item.path}
                  className="layout-switcher-link"
                  href={item.path}
                  aria-current={current ? 'page' : undefined}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
          <div
            className="nav"
            role="tablist"
            aria-orientation="vertical"
            aria-label="Advanced options"
            onKeyDown={onNavKeyDown}
          >
            {tabs.map((tab) => {
              const selected = tab.id === activeTab.id;
              return (
                <button
                  key={tab.id}
                  ref={(node) => {
                    tabRefs.current[tab.id] = node;
                  }}
                  id={`tab-${tab.id}`}
                  type="button"
                  role="tab"
                  className="nav-btn"
                  aria-selected={selected}
                  aria-controls="advanced-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => {
                    setActiveId(tab.id);
                    dismissTip();
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </aside>
        <div
          className="main"
          role="tabpanel"
          id="advanced-panel"
          aria-labelledby={`tab-${activeTab.id}`}
        >
          <AnimatedHeight contentKey={activeTab.id}>
            <TabBody
              tab={activeTab}
              selectedTemplate={selectedTemplate}
              onSelectTemplate={selectTemplate}
              titled={layout.path === '/'}
            />
          </AnimatedHeight>
        </div>
      </form>
    </PanelContext.Provider>
  );
}

const HEIGHT_SETTLE_MS = 300;

/** Eases the panel between category heights so switching tabs slides instead of snapping. */
function AnimatedHeight({ contentKey, children }: { contentKey: string; children: ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const applyRef = useRef<() => void>(() => {});

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    let ready = false;
    let settleTimer: number | null = null;

    const apply = () => {
      const next = inner.offsetHeight;
      if (ready && outer.style.height === `${next}px`) return;
      outer.style.height = `${next}px`;
      if (!ready) {
        ready = true;
        outer.classList.add('is-ready');
        return;
      }
      outer.classList.add('is-resizing');
      if (settleTimer !== null) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => outer.classList.remove('is-resizing'), HEIGHT_SETTLE_MS);
    };

    applyRef.current = apply;
    apply();
    // Catches height changes within a category, such as nested settings appearing.
    const observer = new ResizeObserver(apply);
    observer.observe(inner);
    return () => {
      observer.disconnect();
      if (settleTimer !== null) window.clearTimeout(settleTimer);
    };
  }, []);

  // Category switches are measured synchronously so the transition starts on the same frame.
  useLayoutEffect(() => {
    applyRef.current();
  }, [contentKey]);

  return (
    <div className="panel-height" ref={outerRef}>
      <div className="panel-height-inner" ref={innerRef}>
        {children}
      </div>
    </div>
  );
}

function TabBody({
  tab,
  selectedTemplate,
  onSelectTemplate,
  titled,
}: {
  tab: TabDef;
  selectedTemplate: TemplateId;
  onSelectTemplate: (id: TemplateId) => void;
  titled: boolean;
}) {
  return (
    <>
      {titled ? (
        <header className="category-header">
          <h2>{tab.label}</h2>
          <p>
            {tab.description}
            {tab.hint && <span className="intro-hint">{tab.hint}</span>}
          </p>
        </header>
      ) : (
        <div className="intro">
          <InfoMark className="intro-icon" />
          <p>
            {tab.description}
            {tab.hint && <span className="intro-hint">{tab.hint}</span>}
          </p>
        </div>
      )}
      {tab.templatePicker && (
        <div className="templates" role="group" aria-label="Proctoring templates">
          {tab.templatePicker.templates.map((template) => {
            const selected = template.id === selectedTemplate;
            return (
              <button
                key={template.id}
                type="button"
                className="template"
                aria-pressed={selected}
                data-template={template.id}
                aria-label={`${template.label}, ${template.sublabel}`}
                onClick={() => onSelectTemplate(template.id)}
              >
                <span className="template-title">{template.label}</span>
                <span className="template-sub">{template.sublabel}</span>
              </button>
            );
          })}
        </div>
      )}
      <div className="settings">
        {tab.settings.map((setting) => (
          <SettingBlock key={setting.id} setting={setting} depth={0} />
        ))}
      </div>
    </>
  );
}

function SettingBlock({ setting, depth }: { setting: SettingDef; depth: number }) {
  const { isInternal, state, dismissTip, openTip } = usePanel();
  const dismissRef = useRef(dismissTip);
  const openTipRef = useRef(openTip);
  dismissRef.current = dismissTip;
  openTipRef.current = openTip;

  useEffect(() => {
    return () => {
      if (openTipRef.current === setting.id) dismissRef.current();
    };
  }, [setting.id]);

  if (!isSettingVisible(setting, state, isInternal)) return null;

  const children = (setting.children ?? []).filter((child) => isSettingVisible(child, state, isInternal));
  const nestedClass = [
    'nested-row',
    `depth-${depth}`,
    setting.bare ? 'bare' : '',
    setting.control === 'formLink' ? 'form-row' : '',
    setting.control === 'dateRange' ? 'date-row' : '',
    setting.control === 'multiSelect' ? 'service-row' : '',
    setting.control === 'action' ? 'action-row' : '',
    setting.control === 'stepper' && setting.placeholder ? 'field-row' : '',
    setting.disabled ? 'is-disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const body = setting.bare ? (
    <div className={nestedClass} data-setting={setting.id}>
      <Control setting={setting} />
    </div>
  ) : depth === 0 ? (
    <div className={`row${setting.disabled ? ' is-disabled' : ''}`} data-setting={setting.id}>
      <div className="lead">
        <Lead setting={setting} />
        {setting.tooltip && <InfoTip setting={setting} alwaysShowInfo={setting.alwaysShowInfo} />}
      </div>
      <div className="controls">
        <Control setting={setting} />
      </div>
    </div>
  ) : (
    <div className={nestedClass} data-setting={setting.id}>
      <div className="lead">
        <Lead setting={setting} />
        {setting.tooltip && <InfoTip setting={setting} alwaysShowInfo={setting.alwaysShowInfo} />}
      </div>
      <div className="controls">
        <Control setting={setting} />
      </div>
    </div>
  );

  return (
    <div className={depth === 0 ? 'block' : undefined}>
      {body}
      {children.map((child) => (
        <SettingBlock key={child.id} setting={child} depth={depth + 1} />
      ))}
    </div>
  );
}

function Lead({ setting }: { setting: SettingDef }) {
  const className = [
    'setting-label',
    setting.control === 'radio' || setting.control === 'checkboxGroup' ? 'group-label' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const badge = setting.badge ? <SettingBadge kind={setting.badge} /> : null;
  const aiBadge = setting.icon === 'ai' ? <AiBadge /> : null;

  if (setting.control === 'toggle' || setting.control === 'text' || setting.control === 'stepper') {
    return (
      <span className="label-line">
        <label htmlFor={`control-${setting.id}`} id={`label-${setting.id}`} className={className}>
          {setting.name}
          {aiBadge}
        </label>
        {badge}
      </span>
    );
  }

  return (
    <span className="label-line">
      <span id={`label-${setting.id}`} className={className}>
        {setting.name}
        {aiBadge}
      </span>
      {badge}
    </span>
  );
}

function SettingBadge({ kind }: { kind: 'New' | 'Coming Soon' }) {
  const slug = kind.toLowerCase().replace(/\s+/g, '-');
  return <span className={`pill pill-${slug}`}>{kind}</span>;
}

function Control({ setting }: { setting: SettingDef }) {
  const { state, update, focusInput, adjust } = usePanel();
  const value = state[setting.id];
  const updateControl = (next: SettingValue) => {
    update(setting.id, next);
    const target = setting.focusChildOn?.[String(next)];
    if (target) focusInput(target);
  };

  if (setting.control === 'toggle') {
    const on = value === 'Yes';
    return (
      <span className="switch">
        <input
          id={`control-${setting.id}`}
          type="checkbox"
          role="switch"
          checked={on}
          aria-checked={on}
          disabled={setting.disabled}
          onChange={(event) => updateControl(event.target.checked ? 'Yes' : 'No')}
        />
        <span className="switch-ui" aria-hidden="true">
          <span className="knob">
            <svg className="switch-check" width="12" height="12" viewBox="0 0 12 12">
              <path
                d="M2.4 6.2 4.7 8.5 9.6 3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </span>
      </span>
    );
  }

  if (setting.control === 'text') {
    const text = typeof value === 'string' ? value : '';
    const limit = (next: string) => next.slice(0, setting.maxLength ?? next.length);
    const commit = (next: string) => update(setting.id, next.trim().slice(0, setting.maxLength ?? next.length));
    if (setting.bare) {
      return (
        <label className="link-field">
          <img className="asset-icon" src={linkIcon} width={16} height={16} alt="" />
          <input
            id={`control-${setting.id}`}
            type="text"
            value={text}
            placeholder={setting.placeholder}
            maxLength={setting.maxLength}
            autoComplete="off"
            spellCheck={false}
            aria-label={setting.name}
            onChange={(event) => update(setting.id, limit(event.target.value))}
            onBlur={(event) => commit(event.target.value)}
          />
        </label>
      );
    }
    return (
      <span className={`text-field-wrap${text ? ' has-value' : ''}`}>
        <input
          id={`control-${setting.id}`}
          className="text-input"
          type="text"
          value={text}
          placeholder={setting.placeholder}
          maxLength={setting.maxLength}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => update(setting.id, limit(event.target.value))}
          onBlur={(event) => commit(event.target.value)}
        />
        {setting.clearable && text && (
          <button
            type="button"
            className="text-clear"
            aria-label={`Clear ${setting.name}`}
            onClick={() => update(setting.id, '')}
          >
            <ClearIcon />
          </button>
        )}
      </span>
    );
  }

  if (setting.control === 'stepper') {
    return <StepperControl setting={setting} value={value} adjust={adjust} update={update} />;
  }

  if (setting.control === 'segmented') {
    const options = setting.options ?? [];
    const move = (delta: number) => {
      const index = Math.max(0, options.indexOf(String(value)));
      const next = options[(index + delta + options.length) % options.length];
      if (next) update(setting.id, next);
    };
    return (
      <div
        className="segments"
        role="radiogroup"
        aria-labelledby={`label-${setting.id}`}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            event.preventDefault();
            move(1);
          }
          if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            event.preventDefault();
            move(-1);
          }
        }}
      >
        {(setting.options ?? []).map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => update(setting.id, option)}
            >
              {option}
            </button>
          );
        })}
      </div>
    );
  }

  if (setting.control === 'radio') {
    return (
      <div className="radios" role="radiogroup" aria-labelledby={`label-${setting.id}`}>
        {(setting.options ?? []).map((option) => {
          const tooltip = setting.optionTooltips?.[option];
          return (
            <span key={option} className="choice-with-tip">
              <label className="choice">
                <input
                  type="radio"
                  name={setting.id}
                  value={option}
                  checked={value === option}
                  onChange={() => updateControl(option)}
                />
                <span>{option}</span>
              </label>
              {tooltip && (
                <InfoTip
                  id={`${setting.id}-${option.toLowerCase().replace(/\s+/g, '-')}`}
                  name={option}
                  content={tooltip}
                  alwaysShowInfo={setting.alwaysShowInfo}
                />
              )}
            </span>
          );
        })}
      </div>
    );
  }

  if (setting.control === 'checkboxGroup') {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="checks" role="group" aria-labelledby={`label-${setting.id}`}>
        {(setting.options ?? []).map((option) => (
          <label key={option} className="choice">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => {
                const chosen = new Set(selected);
                if (chosen.has(option)) chosen.delete(option);
                else chosen.add(option);
                update(
                  setting.id,
                  (setting.options ?? []).filter((item) => chosen.has(item)),
                );
              }}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    );
  }

  if (setting.control === 'multiSelect') {
    return <MultiSelect setting={setting} />;
  }

  if (setting.control === 'ipList') {
    return <IpList setting={setting} />;
  }

  if (setting.control === 'formLink') {
    return <FormLink setting={setting} />;
  }

  if (setting.control === 'dateRange') {
    return <DateRange setting={setting} />;
  }

  return (
    <button type="button" className="ghost-btn">
      <img className="asset-icon" src={mailIcon} width={16} height={16} alt="" />
      {setting.actionLabel ?? setting.name}
    </button>
  );
}

const IP_LIMIT = 5;

function DateRange({ setting }: { setting: SettingDef }) {
  const { state, update } = usePanel();
  const current = state[setting.id];
  const range = Array.isArray(current) ? current : ['', ''];
  const start = range[0] ?? '';
  const end = range[1] ?? '';

  const setPart = (index: 0 | 1, next: string) => {
    const value = [...range];
    value[index] = next;
    if (value.length < 2) value.push('');
    update(setting.id, value);
  };

  return (
    <div className="date-range" role="group" aria-label={setting.name}>
      <DateField
        id={`control-${setting.id}`}
        label="Review window start"
        value={start}
        max={end || undefined}
        onChange={(next) => setPart(0, next)}
      />
      <span className="date-arrow" aria-hidden="true">
        <DateArrowIcon />
      </span>
      <DateField
        label="Review window end"
        value={end}
        min={start || undefined}
        onChange={(next) => setPart(1, next)}
      />
    </div>
  );
}

function DateField({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: {
  id?: string;
  label: string;
  value: string;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const openPicker = () => {
    const input = inputRef.current;
    if (!input) return;
    try {
      input.showPicker?.();
    } catch {
      input.focus();
    }
  };

  return (
    <label className={`date-field${value ? ' has-value' : ''}`}>
      <CalendarIcon />
      <span className={value ? 'date-value' : 'date-placeholder'}>{formatDateTime(value)}</span>
      <input
        ref={inputRef}
        id={id}
        type="datetime-local"
        value={value}
        min={min}
        max={max}
        aria-label={label}
        onClick={openPicker}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function formatDateTime(value: string): string {
  if (!value) return 'Select Date & Time';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Select Date & Time';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(parsed);
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="2.2" y="3.4" width="11.6" height="10.4" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.2 6.4h11.6" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.2 2.2v2.4M10.8 2.2v2.4" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function DateArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8h10M9.2 4.8 12.4 8 9.2 11.2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function isIpv4(value: string): boolean {
  const parts = value.split('.');
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    if (part.length > 1 && part.startsWith('0')) return false;
    const octet = Number(part);
    return octet >= 0 && octet <= 255;
  });
}

function StepperControl({
  setting,
  value,
  adjust,
  update,
}: {
  setting: SettingDef;
  value: SettingValue;
  adjust: PanelContextValue['adjust'];
  update: PanelContextValue['update'];
}) {
  const min = setting.min ?? 0;
  const max = setting.max ?? 999;
  const current = typeof value === 'string' ? value : String(min);
  const [draft, setDraft] = useState(current);

  useEffect(() => setDraft(current), [current]);

  const numeric = Number(draft);
  const valid = /^\d+$/.test(draft) && numeric >= min && numeric <= max;
  const invalid = draft !== '' && !valid;
  const atMin = Number.isFinite(Number(current)) && Number(current) <= min;
  const atMax = Number.isFinite(Number(current)) && Number(current) >= max;
  const bump = (delta: number) => adjust(setting.id, delta, min, max);
  const commit = () => {
    const next = clampStepper(draft, min, max);
    setDraft(next);
    update(setting.id, next);
  };

  const stepper = (
    <span className="stepper-wrap">
      {invalid && (
        <span className="stepper-error" id={`error-${setting.id}`} role="alert">
          Enter a value from {min} to {max}.
        </span>
      )}
      <span className={`stepper${invalid ? ' is-invalid' : ''}`}>
        <input
          id={`control-${setting.id}`}
          inputMode="numeric"
          value={draft}
          aria-label={setting.name}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={valid ? numeric : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `error-${setting.id}` : undefined}
          onBeforeInput={(event) => {
            const data = event.data;
            if (data && /\D/.test(data)) event.preventDefault();
          }}
          onChange={(event) => {
            const next = event.target.value.slice(0, 5);
            if (!/^\d*$/.test(next)) return;
            setDraft(next);
            const parsed = Number(next);
            if (/^\d+$/.test(next) && parsed >= min && parsed <= max) {
              update(setting.id, String(parsed));
            }
          }}
          onBlur={commit}
          onKeyDown={(event) => {
            if (
              event.key.length === 1 &&
              /\D/.test(event.key) &&
              !event.ctrlKey &&
              !event.metaKey &&
              !event.altKey
            ) {
              event.preventDefault();
              return;
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              bump(1);
            }
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              bump(-1);
            }
          }}
        />
        <span className="stepper-spin">
          <button
            type="button"
            aria-label={`Increase ${setting.name}`}
            disabled={atMax}
            onClick={() => bump(1)}
          >
            <Chevron />
          </button>
          <button
            type="button"
            aria-label={`Decrease ${setting.name}`}
            disabled={atMin}
            onClick={() => bump(-1)}
          >
            <Chevron down />
          </button>
        </span>
      </span>
      {setting.suffix && <span className="suffix">{setting.suffix}</span>}
    </span>
  );

  if (!setting.placeholder) return stepper;
  return (
    <div className="field-stepper">
      <span className="field-stepper-label">{setting.placeholder}</span>
      {stepper}
    </div>
  );
}

function IpList({ setting }: { setting: SettingDef }) {
  const { state, update, validationErrors, clearValidationError } = usePanel();
  const current = state[setting.id];
  const ips = Array.isArray(current) ? current : [];
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const displayedError = error ?? validationErrors[setting.id] ?? null;
  const full = ips.length >= IP_LIMIT;

  const add = () => {
    const value = draft.trim();
    if (!value || full) return;
    if (!isIpv4(value)) {
      setError('Enter a valid IPv4 address, e.g. 192.168.1.1');
      return;
    }
    if (ips.includes(value)) {
      setError('That IP address has already been added.');
      return;
    }
    update(setting.id, [...ips, value]);
    clearValidationError(setting.id);
    setDraft('');
    setError(null);
  };

  return (
    <div className="ip-editor">
      <div className="ip-entry">
        <div className={`ip-field${displayedError ? ' is-invalid' : ''}`}>
          <input
            id={`control-${setting.id}`}
            className="text-input"
            type="text"
            value={draft}
            placeholder="Add IP Address..."
            disabled={full}
            aria-label={setting.name}
            aria-invalid={displayedError ? true : undefined}
            aria-describedby={displayedError ? `ip-error-${setting.id}` : undefined}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => {
              setDraft(event.target.value);
              if (error) setError(null);
              if (validationErrors[setting.id]) clearValidationError(setting.id);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                add();
              }
            }}
          />
          {displayedError && draft && (
            <button type="button" className="ip-clear" aria-label="Clear IP address" onClick={() => {
              setDraft('');
              setError(null);
            }}>
              <ClearIcon />
            </button>
          )}
          {displayedError && (
            <p id={`ip-error-${setting.id}`} className="ip-error">
              {displayedError}
            </p>
          )}
        </div>
        <button type="button" className="ip-add" disabled={full} onClick={add}>
          Add
        </button>
      </div>
      {ips.length > 0 && (
        <ul className="ip-chips">
          {ips.map((ip) => (
            <li key={ip} className="ip-chip">
              <span>{ip}</span>
              <button type="button" aria-label={`Remove ${ip}`} onClick={() => update(setting.id, ips.filter((item) => item !== ip))}>
                <ClearIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ClearIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M2 2 8 8M8 2 2 8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function AiBadge() {
  return (
    <span className="ai-badge" aria-hidden="true">
      <img src={starsIcon} width={16} height={16} alt="" />
      AI
    </span>
  );
}

function MultiSelect({ setting }: { setting: SettingDef }) {
  const { state, update, dismissTip } = usePanel();
  const [open, setOpen] = useState(false);
  const [revealClear, setRevealClear] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = state[setting.id];
  const selected: string[] = Array.isArray(current) ? current : [];

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const toggle = (option: string) => {
    const chosen = new Set(selected);
    if (chosen.has(option)) chosen.delete(option);
    else chosen.add(option);
    update(
      setting.id,
      (setting.options ?? []).filter((item) => chosen.has(item)),
    );
  };

  const showClear = selected.length > 0 && revealClear;

  return (
    <div
      className="menu service-menu"
      ref={rootRef}
      onMouseEnter={() => setRevealClear(true)}
      onMouseLeave={() => setRevealClear(false)}
    >
      <button
        type="button"
        className="menu-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={setting.name}
        onClick={() => {
          dismissTip();
          setOpen((isOpen) => !isOpen);
        }}
      >
        {selected.length > 0 ? (
          <span className="chips">
            {selected.map((item) => (
              <span key={item} className="chip">
                {item}
              </span>
            ))}
          </span>
        ) : (
          <span className="placeholder">{setting.placeholder}</span>
        )}
        {showClear ? (
          <span className="chevron-slot" aria-hidden="true" />
        ) : (
          <Chevron className="chevron" down={!open} />
        )}
      </button>
      {selected.length > 0 && (
        <button
          type="button"
          className={`menu-clear${showClear ? ' is-visible' : ''}`}
          aria-label={`Clear ${setting.name}`}
          onFocus={() => setRevealClear(true)}
          onBlur={() => setRevealClear(false)}
          onClick={() => update(setting.id, [])}
        >
          <ClearIcon />
        </button>
      )}
      {open && (
        <ul className="menu-list" role="listbox" aria-label={setting.name} aria-multiselectable="true">
          {(setting.options ?? []).map((option) => {
            const on = selected.includes(option);
            return (
              <li key={option}>
                <button
                  type="button"
                  className="menu-option"
                  role="option"
                  aria-selected={on}
                  onClick={() => toggle(option)}
                >
                  <span>{option}</span>
                  {on && (
                    <span className="tick" aria-hidden="true">
                      <MenuCheckIcon />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const TIP_GAP = 8;
const TIP_EDGE = 12;

type InfoTipProps = (
  | { setting: SettingDef; id?: never; name?: never; content?: never }
  | { setting?: never; id: string; name: string; content: string }
) & {
  /** Defaults to hover-to-reveal; set for settings whose options each need an explanation. */
  alwaysShowInfo?: boolean;
};

function InfoTip(props: InfoTipProps) {
  const { openTip, showTip, hideTip, toggleTip, dismissTip } = usePanel();
  const descriptor =
    props.setting !== undefined
      ? { id: props.setting.id, name: props.setting.name, content: props.setting.tooltip }
      : { id: props.id, name: props.name, content: props.content };
  const { id, name, content } = descriptor;
  const open = openTip === id;
  const wrapRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const [placement, setPlacement] = useState<'right' | 'left' | 'bottom'>('right');
  const [fallbackStyle, setFallbackStyle] = useState<CSSProperties | undefined>(undefined);

  /** Sit to the right of the icon; drop below only when the viewport is too narrow for it. */
  useLayoutEffect(() => {
    if (!open) {
      setPlacement('right');
      setFallbackStyle(undefined);
      return;
    }
    if (placement !== 'right') return;
    const anchor = wrapRef.current?.getBoundingClientRect();
    const tip = tipRef.current?.getBoundingClientRect();
    if (!anchor || !tip) return;
    const viewport = document.documentElement.clientWidth;
    if (tip.width <= viewport - anchor.right - TIP_GAP - TIP_EDGE) return;
    if (tip.width <= anchor.left - TIP_GAP - TIP_EDGE) {
      setPlacement('left');
      return;
    }
    const width = Math.min(tip.width, viewport - TIP_EDGE * 2);
    const left = Math.min(Math.max(TIP_EDGE, anchor.left), viewport - TIP_EDGE - width);
    const arrow = Math.min(Math.max(8, anchor.left + anchor.width / 2 - left - 6), width - 20);
    setPlacement('bottom');
    setFallbackStyle({ left: left - anchor.left, maxWidth: width, '--tip-arrow': `${arrow}px` } as CSSProperties);
  }, [open, placement, id]);

  return (
    <span
      className={`info-wrap${props.alwaysShowInfo ? ' always-show' : ''}`}
      ref={wrapRef}
      data-tooltip-root=""
      onMouseEnter={() => showTip(id)}
      onMouseLeave={() => hideTip(id)}
    >
      <button
        type="button"
        className="info-btn"
        aria-label={`More information about ${name}`}
        aria-expanded={open}
        aria-describedby={open ? `tip-${id}` : undefined}
        onClick={(event) => {
          event.stopPropagation();
          toggleTip(id);
        }}
        onFocus={() => showTip(id)}
        onBlur={() => hideTip(id)}
        onKeyDown={(event) => {
          if (event.key !== 'Escape') return;
          event.stopPropagation();
          dismissTip();
        }}
      >
        <InfoMark />
      </button>
      {open && content && (
        <span
          ref={tipRef}
          role="tooltip"
          id={`tip-${id}`}
          className="tooltip"
          data-placement={placement}
          style={fallbackStyle}
        >
          {content}
        </span>
      )}
    </span>
  );
}

function InfoMark({ className }: { className?: string }) {
  return <span className={['info-mark', className].filter(Boolean).join(' ')} aria-hidden="true" />;
}

function Chevron({ down, className }: { down?: boolean; className?: string }) {
  return (
    <svg
      className={className}
      width="10"
      height="10"
      viewBox="0 0 10 10"
      aria-hidden="true"
      style={down ? { transform: 'rotate(180deg)' } : undefined}
    >
      <path d="M2 6.5 5 3.5 8 6.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function MenuCheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3.4 8.2 6.5 11.2 12.6 4.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FormLink({ setting }: { setting: SettingDef }) {
  const { state, update } = usePanel();
  const raw = state[setting.id];
  const text = typeof raw === 'string' ? raw : '';
  const inputRef = useRef<HTMLInputElement>(null);
  const copiedTimer = useRef<number | null>(null);
  const [overflows, setOverflows] = useState(false);
  const [copied, setCopied] = useState(false);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const measure = () => setOverflows(textOverflows(input, text));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(input);
    return () => observer.disconnect();
  }, [text]);

  useEffect(() => {
    setCopied(false);
  }, [text]);

  useEffect(() => {
    return () => {
      if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current);
    };
  }, []);

  return (
    <div className={`form-link${text ? ' has-value' : ''}`}>
      <label className="link-field">
        <img className="asset-icon" src={linkIcon} width={16} height={16} alt="" />
        <input
          ref={inputRef}
          id={`control-${setting.id}`}
          type="text"
          inputMode="url"
          value={text}
          placeholder={setting.placeholder ?? 'Add Form Link'}
          aria-label={setting.name}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => update(setting.id, event.target.value)}
          onBlur={(event) => update(setting.id, event.target.value.trim())}
        />
        {text && (
          <button
            type="button"
            className={`form-copy${copied ? ' is-copied' : ''}`}
            aria-label={copied ? 'Copied' : 'Copy form link'}
            aria-live="polite"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              void copyText(text).then((ok) => {
                if (!ok) return;
                setCopied(true);
                if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current);
                copiedTimer.current = window.setTimeout(() => setCopied(false), 3000);
              });
            }}
          >
            {copied ? (
              <img className="asset-icon" src={checkIcon} width={16} height={16} alt="" />
            ) : (
              <img className="asset-icon" src={copyIcon} width={16} height={16} alt="" />
            )}
          </button>
        )}
      </label>
      {text && overflows && (
        <span className="form-link-tip">
          <span role="tooltip" className="form-link-tip-body">
            {text}
          </span>
        </span>
      )}
    </div>
  );
}

function textOverflows(input: HTMLInputElement, value: string): boolean {
  if (!value) return false;
  const style = getComputedStyle(input);
  const probe = document.createElement('span');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.whiteSpace = 'pre';
  probe.style.font = style.font;
  probe.textContent = value;
  document.body.appendChild(probe);
  const width = probe.getBoundingClientRect().width;
  probe.remove();
  return width > input.clientWidth + 1;
}

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = value;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand('copy');
    area.remove();
    return copied;
  }
}
