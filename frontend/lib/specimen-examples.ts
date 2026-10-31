type SpecimenExample = {
  excerpt: string;
  sourceUrl: string;
};

export const SPECIMEN_EXAMPLES: Partial<Record<string, SpecimenExample>> = {
  sockguard: {
    excerpt:
      'rules:\n  - match: { method: GET, path: "/_ping" }\n    action: allow\n  - match: { method: GET, path: "/containers/json" }\n    action: allow',
    sourceUrl:
      "https://github.com/CodesWhat/sockguard/blob/3bb9f9c9f4aa31681ff873864604a2f9a04daa38/README.md#L366-L370",
  },
  drydock: {
    excerpt:
      '    environment:\n      - DD_WATCHER_LOCAL_HOST=socket-proxy\n      - DD_WATCHER_LOCAL_PORT=2375\n      - DD_AUTH_BASIC_ADMIN_USER=admin\n      - "DD_AUTH_BASIC_ADMIN_HASH=<paste-argon2id-hash>"',
    sourceUrl:
      "https://github.com/CodesWhat/drydock/blob/c98208d091e3abf58400f1bfd306240c2501a633/README.md#L101-L105",
  },
  portwing: {
    excerpt:
      "services:\n  portwing:\n    image: ghcr.io/codeswhat/portwing:1.0.1\n    restart: unless-stopped\n    read_only: true",
    sourceUrl:
      "https://github.com/CodesWhat/portwing/blob/0493eae9a70b7c2cc1babecb662e940e32d66dff/README.md#L217-L221",
  },
  "portkey-admin-mcp": {
    excerpt:
      "PORTKEY_API_KEY=your_key \\\nPORTKEY_TOOL_DOMAINS=prompts,analytics \\\nnpx -y portkey-admin-mcp",
    sourceUrl:
      "https://github.com/CodesWhat/portkey-admin-mcp/blob/a714ec4e2286fe38421d05e51c4af40220051ef7/README.md#L118-L120",
  },
  mouthtype: {
    excerpt:
      "2. Open the DMG, drag Mouthtype to Applications and open it.\n3. Grant Microphone and Accessibility access when prompted. The speech model and a small speech detector download on first launch.\n4. Click an ordinary text field, hold **Fn**, speak, then release.",
    sourceUrl:
      "https://github.com/CodesWhat/mouthtype/blob/ee7bff78154de72115ac4516b25de23dd6bdc4c2/README.md#L90-L92",
  },
  idlescreen: {
    excerpt:
      "Open idlescreen once, then select it in System Settings under Wallpaper and\nScreen Saver. Camera access is requested only when you explicitly choose a\ncamera effect. Gatekeeper and System Integrity Protection stay enabled.",
    sourceUrl:
      "https://github.com/CodesWhat/idlescreen/blob/1d357b8211279b7f07c79dca15fab28ac6f185bb/README.md#L58-L60",
  },
  careerrat: {
    excerpt:
      "careerrat next          # show the next useful agent-led workflow\ncareerrat doctor        # verify setup, data, skills, and runtime health\ncareerrat update        # update an npm installation without touching user data\ncareerrat tracker       # write a recovery snapshot and summary\ncareerrat tracker-dev   # serve the local browser workspace at localhost:7777",
    sourceUrl:
      "https://github.com/CodesWhat/careerrat/blob/f2f696d52de1f7352fdd6398bdf0dc855dff26ea/README.md#L490-L494",
  },
};
