export type ControlType =
  | 'toggle'
  | 'radio'
  | 'text'
  | 'stepper'
  | 'segmented'
  | 'checkboxGroup'
  | 'multiSelect'
  | 'ipList'
  | 'formLink'
  | 'dateRange'
  | 'action';

export type SettingValue = string | string[];

export type SettingBadge = 'New' | 'Coming Soon';

export interface SettingDef {
  id: string;
  name: string;
  control: ControlType;
  options?: string[];
  optionTooltips?: Record<string, string>;
  default: SettingValue;
  tooltip?: string;
  /** Info icons stay visible instead of revealing on strip hover. */
  alwaysShowInfo?: boolean;
  placeholder?: string;
  suffix?: string;
  actionLabel?: string;
  bare?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
  clearable?: boolean;
  badge?: SettingBadge;
  icon?: 'ai';
  disabled?: boolean;
  /** Child input to focus after this setting changes to a matching value. */
  focusChildOn?: Record<string, string>;
  /** Visible only for internal viewers. */
  internalOnly?: boolean;
  showWhen?: Array<{
    id: string;
    is: (value: SettingValue) => boolean;
  }>;
  children?: SettingDef[];
}

export interface TemplateCard {
  id: TemplateId;
  label: string;
  sublabel: string;
}

export interface TabDef {
  id: string;
  label: string;
  description: string;
  hint?: string;
  internalOnly?: boolean;
  templatePicker?: {
    defaultTemplate: TemplateId;
    templates: TemplateCard[];
  };
  settings: SettingDef[];
}

export type TemplateId = 'Practice' | 'Standard' | 'Shield';

export type SettingState = Record<string, SettingValue>;

const isYes = (value: SettingValue) => value === 'Yes';
const isPassing = (value: SettingValue) => value === 'Passing Marks';
const isTop = (value: SettingValue) => value === 'Top Candidates';
const isAfterAttempt = (value: SettingValue) => value === 'After Attempt';
const isAfterExamEnds = (value: SettingValue) => value === 'After Exam Ends';
const hasAny = (value: SettingValue) => Array.isArray(value) && value.length > 0;

const when =
  (id: string, is: (value: SettingValue) => boolean): SettingDef['showWhen'] => [{ id, is }];

export const TEMPLATES: TemplateCard[] = [
  { id: 'Standard', label: 'Standard', sublabel: 'Balanced security for exams' },
  { id: 'Shield', label: 'Secure', sublabel: 'Maximum security for exams' },
  { id: 'Practice', label: 'Practice', sublabel: 'Light checks for low-stakes runs' },
];

export const DEFAULT_TEMPLATE: TemplateId = 'Standard';

const sharedOff = {
  'attempt-on-mobile': 'No',
  'ip-restriction': 'No',
  'secure-browser': 'No',
  'electronic-device-detection': 'No',
  'exit-password': '',
  'qr-attendance': 'No',
  'presence-check': 'No',
  'pin-type': 'Assessment-Specific PIN',
};

export const TEMPLATE_PRESETS: Record<TemplateId, Record<string, string>> = {
  Practice: {
    ...sharedOff,
    'camera-monitoring': 'No',
    'auto-terminate-camera': 'No',
    'audio-monitoring': 'No',
    'screen-monitoring': 'Yes',
    'face-verification': 'No',
    'auto-terminate-on-violations': 'No',
    'tab-monitoring': 'No',
    'warnings-before-termination': '5',
    'exam-pin': 'No',
    'pin-rotation': '2 min',
  },
  Standard: {
    ...sharedOff,
    'camera-monitoring': 'Yes',
    'auto-terminate-camera': 'No',
    'audio-monitoring': 'Yes',
    'screen-monitoring': 'Yes',
    'face-verification': 'Yes',
    'auto-terminate-on-violations': 'Yes',
    'tab-monitoring': 'Yes',
    'warnings-before-termination': '5',
    'exam-pin': 'No',
    'pin-rotation': '2 min',
  },
  Shield: {
    ...sharedOff,
    'camera-monitoring': 'Yes',
    'auto-terminate-camera': 'No',
    'audio-monitoring': 'Yes',
    'screen-monitoring': 'Yes',
    'face-verification': 'Yes',
    'auto-terminate-on-violations': 'Yes',
    'tab-monitoring': 'Yes',
    'warnings-before-termination': '3',
    'exam-pin': 'Yes',
    'pin-rotation': '2 min',
  },
};

export const TABS: TabDef[] = [
  {
    id: 'proctoring',
    label: 'Proctoring',
    description:
      'Choose how the exam is accessed, secured, and monitored. Pick a template or customize each setting.',
    templatePicker: {
      defaultTemplate: DEFAULT_TEMPLATE,
      templates: TEMPLATES,
    },
    settings: [
      {
        id: 'camera-monitoring',
        name: 'Camera Monitoring',
        control: 'toggle',
        default: 'Yes',
        tooltip:
          "Monitors the candidate's camera feed to detect additional people or unusual activity in their surroundings.",
        children: [
          {
            id: 'auto-terminate-camera',
            name: 'Auto-Terminate on Camera Violations',
            control: 'toggle',
            default: 'No',
            tooltip: "Ends the exam automatically if a camera violation isn't cleared within 30 seconds.",
            showWhen: when('camera-monitoring', isYes),
          },
        ],
      },
      {
        id: 'audio-monitoring',
        name: 'Audio Monitoring',
        control: 'toggle',
        default: 'Yes',
        tooltip: "Monitors the candidate's microphone for external noise or disturbance.",
      },
      {
        id: 'screen-monitoring',
        name: 'Screen Monitoring',
        control: 'toggle',
        default: 'Yes',
        tooltip:
          "Records the candidate's screen throughout the exam and flags suspicious activity for review.",
      },
      {
        id: 'face-verification',
        name: 'Face Verification',
        control: 'toggle',
        default: 'Yes',
        tooltip: "Verifies the candidate's face at intervals throughout the exam to prevent impersonation.",
      },
      {
        id: 'electronic-device-detection',
        name: 'Electronic Device Detection',
        control: 'toggle',
        default: 'No',
        tooltip:
          'Detects and logs electronic devices such as phones, tablets, secondary screens, or laptops visible during the exam.',
      },
      {
        id: 'auto-terminate-on-violations',
        name: 'Auto-Terminate on Violations',
        control: 'toggle',
        default: 'Yes',
        tooltip:
          "Ends the exam automatically once a candidate's violations cross the configured warning threshold.",
      },
      {
        id: 'tab-monitoring',
        name: 'Tab & Window Switch Monitoring',
        control: 'toggle',
        default: 'Yes',
        tooltip:
          'Monitors tab and window activity and raises a violation each time the candidate leaves the exam window.',
        children: [
          {
            id: 'warnings-before-termination',
            name: 'Warnings Before Termination',
            control: 'stepper',
            default: '5',
            min: 1,
            max: 99,
            tooltip:
              'Sets how many times a candidate can leave the exam window before the exam is automatically terminated.',
            showWhen: when('tab-monitoring', isYes),
          },
        ],
      },
      {
        id: 'attempt-on-mobile',
        name: 'Attempt on Mobile',
        control: 'toggle',
        default: 'No',
        tooltip:
          'Assessments can be attempted on mobile, but proctoring features are unavailable. Coding exams are not supported.',
      },
      {
        id: 'secure-browser',
        name: 'Secure Browser Exam',
        control: 'toggle',
        default: 'No',
        internalOnly: true,
        tooltip:
          "Runs the exam inside Topin's secure browser, locking down the device to prevent access to other applications or tabs.",
        children: [
          {
            id: 'exit-password',
            name: 'Custom Exam Exit Password',
            control: 'text',
            default: '',
            placeholder: 'Enter Custom Exit Password',
            maxLength: 6,
            clearable: true,
            internalOnly: true,
            tooltip:
              'Secure browser exams require an exit password to leave lockdown. A random password is generated by default, or you can set a custom one.',
            showWhen: when('secure-browser', isYes),
          },
          {
            id: 'qr-attendance',
            name: 'QR-Based Attendance',
            control: 'toggle',
            default: 'No',
            internalOnly: true,
            tooltip:
              "Confirms candidates' physical presence by scanning a QR code; best suited for offline exams.",
            showWhen: when('secure-browser', isYes),
          },
        ],
      },
      {
        id: 'exam-pin',
        name: 'Exam PIN',
        control: 'toggle',
        default: 'No',
        internalOnly: true,
        tooltip: 'Requires candidates to enter a PIN before starting the exam.',
        children: [
          {
            id: 'pin-type',
            name: 'PIN Type',
            control: 'radio',
            options: ['Assessment-Specific PIN', 'Common Start PIN'],
            default: 'Assessment-Specific PIN',
            internalOnly: true,
            alwaysShowInfo: true,
            optionTooltips: {
              'Assessment-Specific PIN':
                'Generates a unique PIN for this assessment only.',
              'Common Start PIN':
                'Uses one shared PIN across all assessments in your organization.',
            },
            showWhen: when('exam-pin', isYes),
          },
          {
            id: 'pin-rotation',
            name: 'PIN Rotation Interval',
            control: 'segmented',
            options: ['30 sec', '1 min', '2 min', '4 min'],
            default: '2 min',
            internalOnly: true,
            tooltip: 'Refreshes the PIN automatically at the interval you set.',
            showWhen: when('exam-pin', isYes),
          },
          {
            id: 'presence-check',
            name: 'Presence Check',
            control: 'toggle',
            default: 'No',
            internalOnly: true,
            tooltip:
              'Requires candidates to re-enter the PIN every 30 minutes during the exam to confirm continued presence.',
            showWhen: when('exam-pin', isYes),
          },
        ],
      },
      {
        id: 'ip-restriction',
        name: 'IP Address Restriction',
        control: 'toggle',
        default: 'No',
        focusChildOn: { Yes: 'ip-addresses' },
        tooltip:
          'Restrict exam access to up to 5 IP addresses so attempts happen only from approved networks.',
        children: [
          {
            id: 'ip-addresses',
            name: 'Allowed IP Addresses',
            control: 'ipList',
            default: [],
            bare: true,
            showWhen: when('ip-restriction', isYes),
          },
        ],
      },
    ],
  },
  {
    id: 'comms',
    label: 'Communications',
    description: 'Choose emails and feedback settings for the exam.',
    settings: [
      {
        id: 'invitation-email',
        name: 'Invitation Email',
        control: 'toggle',
        default: 'Yes',
        tooltip: "Sends an invitation email to candidates as soon as they're invited.",
        children: [
          {
            id: 'customise-invitation',
            name: 'Customise Invitation Mail',
            control: 'action',
            default: '',
            actionLabel: 'Customise Invitation Mail',
            bare: true,
            showWhen: when('invitation-email', isYes),
          },
        ],
      },
      {
        id: 'reminder-email',
        name: 'Reminder Email',
        control: 'toggle',
        default: 'Yes',
        tooltip: 'Sends a reminder email to invited candidates 1 hour before the exam starts.',
        children: [
          {
            id: 'customise-reminder',
            name: 'Customise Reminder Mail',
            control: 'action',
            default: '',
            actionLabel: 'Customise Reminder Mail',
            bare: true,
            showWhen: when('reminder-email', isYes),
          },
        ],
      },
      {
        id: 'pre-exam-form',
        name: 'Pre Exam Form',
        control: 'toggle',
        default: 'No',
        focusChildOn: { Yes: 'pre-exam-form-link' },
        tooltip: 'Displays a form to candidates before they begin the exam.',
        children: [
          {
            id: 'pre-exam-form-link',
            name: 'Form Link',
            control: 'formLink',
            default: '',
            placeholder: 'Add Form Link',
            bare: true,
            showWhen: when('pre-exam-form', isYes),
          },
        ],
      },
    ],
  },
  {
    id: 'results',
    label: 'Results & Review',
    description:
      'Choose how candidates are shortlisted and what performance details they can see afterward.',
    settings: [
      {
        id: 'shortlisting-criteria',
        name: 'Shortlisting Criteria',
        control: 'radio',
        options: ['No Criteria', 'Passing Marks', 'Top Candidates'],
        default: 'No Criteria',
        focusChildOn: {
          'Passing Marks': 'passing-mark',
          'Top Candidates': 'top-candidates',
        },
        alwaysShowInfo: true,
        optionTooltips: {
          'No Criteria': 'All candidates who attempt the assessment pass, regardless of score.',
          'Passing Marks':
            'Set a minimum passing score. Candidates scoring above it are shortlisted; others are rejected.',
          'Top Candidates':
            'Set the number of top-performing candidates to shortlist; others are rejected.',
        },
        children: [
          {
            id: 'passing-mark',
            name: 'Enter Passing Mark',
            control: 'stepper',
            default: '5',
            min: 1,
            max: 75,
            suffix: '/75',
            placeholder: 'Enter Passing Mark',
            bare: true,
            tooltip: 'Minimum score required for a candidate to pass. Cannot exceed 75.',
            showWhen: when('shortlisting-criteria', isPassing),
          },
          {
            id: 'top-candidates',
            name: 'Number of Top Candidates',
            control: 'stepper',
            default: '5',
            min: 1,
            max: 500,
            placeholder: 'Number of Top Candidates',
            bare: true,
            tooltip: 'How many of the highest scores are shortlisted.',
            showWhen: when('shortlisting-criteria', isTop),
          },
        ],
      },
      {
        id: 'submission-report',
        name: 'Submission Report',
        control: 'radio',
        options: ['No Review', 'After Attempt', 'After Exam Ends'],
        default: 'No Review',
        focusChildOn: { 'After Exam Ends': 'review-window' },
        alwaysShowInfo: true,
        optionTooltips: {
          'No Review': 'Candidates cannot view a submission report.',
          'After Attempt': 'Candidates can review immediately after they finish the exam.',
          'After Exam Ends':
            'Candidates can review only during the date and time window you set.',
        },
        children: [
          {
            id: 'show-correct-answer',
            name: 'Show Correct Answer During Review',
            control: 'toggle',
            default: 'No',
            tooltip: 'Also shows candidates the correct answers when they review their submission report.',
            showWhen: when('submission-report', isAfterAttempt),
          },
          {
            id: 'review-window',
            name: 'Show Correct Answer During Review',
            control: 'dateRange',
            default: ['', ''],
            showWhen: when('submission-report', isAfterExamEnds),
          },
        ],
      },
      {
        id: 'stats-visibility',
        name: 'Candidate Statistics Visibility',
        control: 'radio',
        options: ['Private', 'Public'],
        default: 'Private',
        alwaysShowInfo: true,
        optionTooltips: {
          Private: 'Keeps candidate statistics visible only within your organization.',
          Public:
            "Allows other organizations on the platform to view this assessment's candidate statistics.",
        },
      },
    ],
  },
  {
    id: 'candidate',
    label: 'Candidate Experience',
    description:
      'Choose what candidates can see or reach on their exam screen, like on-screen tools, and the support options.',
    settings: [
      {
        id: 'allow-multiple-submissions',
        name: 'Multiple Submissions',
        control: 'toggle',
        default: 'Yes',
        tooltip: 'Lets candidates resubmit their answer for an MCQ question more than once.',
      },
      {
        id: 'scientific-calculator',
        name: 'Scientific Calculator',
        control: 'toggle',
        default: 'No',
        badge: 'New',
        tooltip: 'Lets candidates use an on-screen scientific calculator in MCQ and Textual sections.',
      },
      {
        id: 'whatsapp-support',
        name: 'WhatsApp Support Option',
        control: 'toggle',
        default: 'No',
      },
      {
        id: 'show-datetime-timer',
        name: 'Assessment Date, Time & Timer',
        control: 'toggle',
        default: 'Yes',
        tooltip: 'Affects visibility of assessment date time and timer on the header & home page',
      },
    ],
  },
  {
    id: 'reporting',
    label: 'Reporting & Analytics',
    description: 'Choose integrity checks, reports, and insights shown to reviewers.',
    settings: [
      {
        id: 'peer-similarity',
        name: 'Peer Similarity Check',
        control: 'toggle',
        default: 'No',
        tooltip:
          "Compares a candidate's code with other candidates' submissions and flags similar or matching code.\nSimilarity is a signal for review, not proof of malpractice.",
      },
      {
        id: 'ai-code-check',
        name: 'AI Generated Code Detection',
        control: 'toggle',
        default: 'No',
        icon: 'ai',
        tooltip:
          'Flags code that may be AI-generated, for C++, Java, and Python questions. This is a signal for review, not proof of malpractice.',
      },
      {
        id: 'integrity-report',
        name: 'AI Integrity Report',
        control: 'toggle',
        default: 'No',
        icon: 'ai',
        tooltip:
          "Generates a report analyzing proctoring signals and the candidate's attempt, to support integrity review.",
      },
      {
        id: 'event-triggers',
        name: 'Event Triggers',
        control: 'checkboxGroup',
        options: ['Send Attempt Start Event', 'Send Attempt End Event'],
        default: [],
        tooltip: 'Emits events to connected external platforms when key actions occur during the assessment.',
        children: [
          {
            id: 'event-services',
            name: 'Services',
            control: 'multiSelect',
            options: ['Learning Platform', 'Accounts'],
            default: [],
            placeholder: 'Select Services',
            bare: true,
            showWhen: when('event-triggers', hasAny),
          },
        ],
      },
    ],
  },
];

function walkSettings(settings: SettingDef[], visit: (setting: SettingDef) => void) {
  settings.forEach((setting) => {
    visit(setting);
    if (setting.children) walkSettings(setting.children, visit);
  });
}

export function collectDefaults(tabs: TabDef[]): SettingState {
  const state: SettingState = {};
  tabs.forEach((tab) => {
    walkSettings(tab.settings, (setting) => {
      state[setting.id] = Array.isArray(setting.default) ? [...setting.default] : setting.default;
    });
  });
  return state;
}

/** Ids owned by the proctoring templates. Every other setting is shared across templates. */
const templateScopedIds = new Set<string>();
TABS.filter((tab) => tab.templatePicker).forEach((tab) => {
  walkSettings(tab.settings, (setting) => templateScopedIds.add(setting.id));
});

export function isTemplateScoped(id: string): boolean {
  return templateScopedIds.has(id);
}

function pickState(state: SettingState, keep: (id: string) => boolean): SettingState {
  const picked: SettingState = {};
  Object.keys(state).forEach((id) => {
    if (!keep(id)) return;
    const value = state[id];
    picked[id] = Array.isArray(value) ? [...value] : (value as SettingValue);
  });
  return picked;
}

export function pickTemplateState(state: SettingState): SettingState {
  return pickState(state, isTemplateScoped);
}

export function pickSharedState(state: SettingState): SettingState {
  return pickState(state, (id) => !isTemplateScoped(id));
}

export function createTemplateState(template: TemplateId): SettingState {
  return {
    ...pickTemplateState(collectDefaults(TABS)),
    ...TEMPLATE_PRESETS[template],
  };
}

export function createSharedState(): SettingState {
  return pickSharedState(collectDefaults(TABS));
}

const STORAGE_KEY = 'nilsen.advanced-options.v2';

function isSettingValue(value: unknown): value is SettingValue {
  return typeof value === 'string' || (Array.isArray(value) && value.every((item) => typeof item === 'string'));
}

export interface PersistedPanel {
  version: 6;
  activeId: string;
  /** Settings that are not owned by a template. */
  shared: SettingState;
  /** One saved configuration per template, so switching templates never loses edits. */
  templates: Record<TemplateId, SettingState>;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function restore(base: SettingState, saved: Record<string, unknown>): SettingState {
  const state = base;
  for (const key of Object.keys(state)) {
    const value = saved[key];
    if (isSettingValue(value)) {
      state[key] = Array.isArray(value) ? [...value] : value;
    }
  }
  return state;
}

function restoreTemplateState(template: TemplateId, saved: Record<string, unknown>): SettingState {
  const state = restore(createTemplateState(template), saved);
  if (state['pin-type'] === 'Assessment Specific PIN') {
    state['pin-type'] = 'Assessment-Specific PIN';
  }
  state['warnings-before-termination'] = clampStepper(
    String(state['warnings-before-termination'] ?? TEMPLATE_PRESETS[template]['warnings-before-termination']),
    1,
    99,
  );
  if (state['camera-monitoring'] !== 'Yes') {
    state['auto-terminate-camera'] = 'No';
  }
  state['exit-password'] = String(state['exit-password'] ?? '').slice(0, 6);
  return state;
}

function restoreSharedState(saved: Record<string, unknown>): SettingState {
  const state = restore(createSharedState(), saved);
  state['passing-mark'] = clampStepper(String(state['passing-mark'] ?? '5'), 1, 75);
  const services = state['event-services'];
  if (Array.isArray(services)) {
    state['event-services'] = services.map((item) => (item === 'learning Platform' ? 'Learning Platform' : item));
  }
  return state;
}

function emptyTemplates(): Record<TemplateId, SettingState> {
  return {
    Practice: createTemplateState('Practice'),
    Standard: createTemplateState('Standard'),
    Shield: createTemplateState('Shield'),
  };
}

export function loadPersistedPanel(): PersistedPanel {
  const fallback: PersistedPanel = {
    version: 6,
    activeId: 'proctoring',
    shared: createSharedState(),
    templates: emptyTemplates(),
  };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = asRecord(JSON.parse(raw));
    const savedTemplates = asRecord(parsed.templates);
    const shieldSaved = asRecord(savedTemplates.Shield);
    const standardSaved = asRecord(savedTemplates.Standard);
    // Practice keeps only Screen Monitoring on by default; drop saved edits from before version 6.
    const practiceSaved =
      typeof parsed.version === 'number' && parsed.version >= 6 ? asRecord(savedTemplates.Practice) : {};
    if (typeof parsed.version !== 'number' || parsed.version < 5) {
      // Correct values produced by earlier defaults without changing later version-4 edits.
      if (standardSaved['warnings-before-termination'] === '1') {
        standardSaved['warnings-before-termination'] = '5';
      }
      if (shieldSaved['warnings-before-termination'] === '5') {
        shieldSaved['warnings-before-termination'] = '3';
      }
      for (const saved of [standardSaved, shieldSaved]) {
        if (saved['pin-rotation'] === '30 sec') saved['pin-rotation'] = '2 min';
      }
      shieldSaved['auto-terminate-camera'] = 'No';
    }
    return {
      version: 6,
      activeId: typeof parsed.activeId === 'string' ? parsed.activeId : 'proctoring',
      shared: restoreSharedState(asRecord(parsed.shared)),
      templates: {
        Practice: restoreTemplateState('Practice', practiceSaved),
        Standard: restoreTemplateState('Standard', standardSaved),
        Shield: restoreTemplateState('Shield', shieldSaved),
      },
    };
  } catch {
    return fallback;
  }
}

export function savePersistedPanel(panel: PersistedPanel) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(panel));
  } catch {
    // Ignore quota or private-mode write failures.
  }
}

export function clampStepper(raw: string, min: number, max: number): string {
  if (raw.trim().startsWith('-')) return String(min);
  const digits = raw.replace(/\D/g, '');
  if (!digits) return String(min);
  const value = Number.parseInt(digits, 10);
  if (!Number.isFinite(value)) return String(min);
  return String(Math.min(max, Math.max(min, value)));
}

export function stepValue(current: string, delta: number, min: number, max: number): string {
  const parsed = Number.parseInt(current, 10);
  const base = Number.isFinite(parsed) ? parsed : min;
  return String(Math.min(max, Math.max(min, base + delta)));
}

export function resolveActiveTab(tabs: TabDef[], activeId: string): string {
  if (tabs.some((tab) => tab.id === activeId)) return activeId;
  return tabs[0]?.id ?? 'proctoring';
}

export function isSettingVisible(setting: SettingDef, state: SettingState, isInternal = true): boolean {
  if (setting.internalOnly && !isInternal) return false;
  if (!setting.showWhen || setting.showWhen.length === 0) return true;
  return setting.showWhen.every((condition) => {
    const current = state[condition.id];
    return current !== undefined && condition.is(current);
  });
}

export function visibleTabs(tabs: TabDef[], isInternal: boolean): TabDef[] {
  return tabs.filter((tab) => isInternal || !tab.internalOnly);
}
