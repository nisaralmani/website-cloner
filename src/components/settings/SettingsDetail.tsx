"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CircleCheck,
  CircleHelp,
  Upload,
  ChevronDown,
  Copy,
  Check,
  AlertCircle,
  AppWindow,
  MapPin,
  Map,
  X,
  UserRound,
  CreditCard,
  ArrowRight,
  List,
  ChevronsUpDown,
  Trash2,
  Calendar,
  Plus,
  Clock,
  Cloud,
  Zap,
  Globe,
  ExternalLink,
  AlertTriangle,
  ChevronRight,
  LogOut,
  MessageCircle,
  Info,
  Ban,
  ListFilter,
  Search,
  Eye,
  Bold,
  Italic,
  Underline,
  Link2,
  Image,
  Film,
  Paperclip,
  Palette,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { appHelpdeskPath, APP_PLUGINS_PATH, appSettingsPath, appWidgetUrl } from "@/lib/marketing-paths";
import type {
  PageConfig,
  PageSection,
  PageUpgradeGate,
  SectionItem,
  TableRowCell,
} from "@/lib/settings-data";
import { PersonGlyph } from "@/components/icons";
import { useSettingsToggles } from "@/hooks/useSettingsToggles";
import { useAccountProfile } from "@/hooks/useAccountProfile";
import { useAccountSecurity } from "@/hooks/useAccountSecurity";
import { useAccountInterface } from "@/hooks/useAccountInterface";
import { useMessageShortcuts } from "@/hooks/useMessageShortcuts";
import { useInboxCustomizeFields } from "@/hooks/useInboxCustomizeFields";
import { useTriageRules } from "@/hooks/useTriageRules";
import { useSubInboxes } from "@/hooks/useSubInboxes";
import { useRoutingRules } from "@/hooks/useRoutingRules";
import { useChatboxAppearanceFields } from "@/hooks/useChatboxAppearanceFields";
import { useChatboxBehaviorFields } from "@/hooks/useChatboxBehaviorFields";
import { useChatboxRestrictions } from "@/hooks/useChatboxRestrictions";
import { useEmailDomainFields } from "@/hooks/useEmailDomainFields";
import {
  useEmailDeliveryFields,
  type EmailConnectionTestResult,
} from "@/hooks/useEmailDeliveryFields";
import { useEmailSignature } from "@/hooks/useEmailSignature";
import { useChatboxAttachmentSettings } from "@/hooks/useChatboxAttachmentSettings";
import { useBillingPlans } from "@/hooks/useBillingPlans";
import { useUpgradePlan } from "@/hooks/useUpgradePlan";
import { useBillingCards } from "@/hooks/useBillingCards";
import { useBillingInvoices } from "@/hooks/useBillingInvoices";
import { EmailDomainField } from "@/components/settings/EmailDomainField";
import { SmtpSettingsField } from "@/components/settings/SmtpSettingsField";
import { OAuthConnectedApps } from "@/components/settings/OAuthConnectedApps";
import { BillingPlansPanel } from "@/components/settings/BillingPlansPanel";
import { BillingCardsPanel } from "@/components/settings/BillingCardsPanel";
import { BillingInvoicesPanel } from "@/components/settings/BillingInvoicesPanel";
import { EmailSignaturePanel } from "@/components/settings/EmailSignaturePanel";
import { ChatboxAttachmentsPanel } from "@/components/settings/ChatboxAttachmentsPanel";
import { WorkspaceOperatorsPanel } from "@/components/settings/WorkspaceOperatorsPanel";
import { WorkspaceBillingPanel } from "@/components/settings/WorkspaceBillingPanel";
import { ApiTokensPanel } from "@/components/settings/ApiTokensPanel";
import { WebhooksPanel } from "@/components/settings/WebhooksPanel";
import { workspaceAdvancedFieldKeyForLabel } from "@/lib/settings/workspace-advanced";
import { webhookCountLabel } from "@/lib/workspaces/webhooks";
import { formatMonthlyTotal } from "@/lib/billing/plans";
import { settingsHelpUrl } from "@/lib/settings-help-urls";
import { useChatboxSearchAiFields } from "@/hooks/useChatboxSearchAiFields";
import { useSearchAiFrequentSearches } from "@/hooks/useSearchAiFrequentSearches";
import { useWorkspaceProfile } from "@/hooks/useWorkspaceProfile";
import { useWorkspaceIntegrations } from "@/hooks/useWorkspaceIntegrations";
import { useShopifyContactSync } from "@/hooks/useShopifyContactSync";
import { useWorkspaceOperators } from "@/hooks/useWorkspaceOperators";
import { useWorkspaceBilling } from "@/hooks/useWorkspaceBilling";
import { useWorkspaceTransparency } from "@/hooks/useWorkspaceTransparency";
import { useWorkspaceAdvanced } from "@/hooks/useWorkspaceAdvanced";
import { useWorkspaceData } from "@/hooks/useWorkspaceData";
import { useWorkspaceDanger } from "@/hooks/useWorkspaceDanger";
import { useSession } from "@/components/providers/SessionProvider";
import { ChangePasswordModal } from "@/components/settings/ChangePasswordModal";
import { AccountProfileField } from "@/components/settings/AccountProfileField";
import { AccountAvatarField } from "@/components/settings/AccountAvatarField";
import { InterfaceSelectField } from "@/components/settings/InterfaceSelectField";
import { MessageShortcutFields } from "@/components/settings/MessageShortcutForm";
import { MessageShortcutsManage } from "@/components/settings/MessageShortcutsManage";
import { WorkspaceProfileField } from "@/components/settings/WorkspaceProfileField";
import { WorkspaceLogoField } from "@/components/settings/WorkspaceLogoField";
import { profileFieldKeyForLabel } from "@/lib/auth/profile";
import type { ProfileFieldKey } from "@/lib/auth/profile";
import { interfaceFieldKeyForLabel } from "@/lib/auth/interface-preferences";
import type { InterfaceFieldKey } from "@/lib/auth/interface-preferences";
import { inboxCustomizeFieldKeyForLabel } from "@/lib/inbox/customize-preferences";
import type { InboxCustomizeFieldKey } from "@/lib/inbox/customize-preferences";
import { chatboxAppearanceFieldKeyForLabel } from "@/lib/chatbox/appearance-preferences";
import { emailDomainFieldKeyForLabel } from "@/lib/email/domain-preferences";
import type { EmailDomainFieldKey } from "@/lib/email/domain-preferences";
import { smtpFieldKeyForLabel } from "@/lib/email/smtp-preferences";
import type { SmtpFieldKey } from "@/lib/email/smtp-preferences";
import { chatboxRestrictionKindForLabel } from "@/lib/chatbox/restrictions";
import { chatboxBehaviorFieldKeyForLabel } from "@/lib/chatbox/behavior-preferences";
import type { ChatboxAppearanceFieldKey } from "@/lib/chatbox/appearance-preferences";
import type { ChatboxBehaviorFieldKey } from "@/lib/chatbox/behavior-preferences";
import { SettingsSelectField } from "@/components/settings/SettingsSelectField";
import { TriageFiltersBar } from "@/components/settings/TriageFiltersBar";
import { AuditFiltersBar } from "@/components/settings/AuditFiltersBar";
import {
  isRoutingRerunToggleKey,
  ROUTING_ENABLE_RULES_TOGGLE_KEY,
} from "@/lib/routing-rules/validation";
import { TriageRulesetSection } from "@/components/settings/TriageRulesetSection";
import { SubInboxesPanel } from "@/components/settings/SubInboxesPanel";
import { RoutingRulesPanel } from "@/components/settings/RoutingRulesPanel";
import { FrequentSearchesPanel } from "@/components/settings/FrequentSearchesPanel";
import {
  isSearchAiDirectToggleKey,
  isSearchAiToggleKey,
  SEARCH_AI_ENABLE_TOGGLE_KEY,
} from "@/lib/chatbox/search-ai-preferences";
import type { TriageRuleset } from "@/types/triage";
import { workspaceFieldKeyForLabel } from "@/lib/workspaces/profile-fields";
import type { WorkspaceProfileFieldKey } from "@/lib/workspaces/profile-fields";
import {
  isAvailabilityPage,
  presenceBannerLabel,
  AVAILABILITY_SCHEDULE_ENABLED_KEY,
} from "@/lib/settings/availability";
import type { AvailabilitySchedule } from "@/lib/settings/schedule";
import {
  AvailabilityDayTabs,
  AvailabilityHoursRow,
  AvailabilityTimezoneSelect,
  useAvailabilitySchedule,
} from "@/components/settings/AvailabilityScheduleFields";

function KeyboardShortcut({ keys }: { keys: string[] }) {
  return (
    <span className="ml-2 inline-flex items-center gap-1">
      {keys.map((key) => (
        <span key={key} className="inline-flex rounded bg-[#5f6d7f] p-px">
          <span className="rounded-[3px] bg-white/80 px-[3px] pt-px text-[11px] leading-none text-[#495462]">
            {key}
          </span>
        </span>
      ))}
    </span>
  );
}

const THEME_COLORS = [
  "#1972F5",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#64748B",
  "#1c293b",
];

export default function SettingsDetail({
  config,
  pageSlug,
}: {
  config: PageConfig;
  pageSlug: string;
}) {
  const [installingPluginId, setInstallingPluginId] = useState<string | null>(null);
  const router = useRouter();
  const isAccountInformation = pageSlug === "account/information";
  const isAccountSecurity = pageSlug === "account/security";
  const isAccountInterface = pageSlug === "account/interface";
  const isInboxShortcuts = pageSlug === "inbox/shortcuts";
  const isInboxCustomize = pageSlug === "inbox/customize";
  const isInboxTriage = pageSlug === "inbox/triage";
  const isInboxSubInboxes = pageSlug === "inbox/sub-inboxes";
  const isInboxRouting = pageSlug === "inbox/routing";
  const isChatboxAppearance = pageSlug === "chatbox/appearance";
  const isChatboxBehavior = pageSlug === "chatbox/behavior";
  const isChatboxSearchAi = pageSlug === "chatbox/search-ai";
  const isChatboxRestrictions = pageSlug === "chatbox/restrictions";
  const isEmailDomain = pageSlug === "email/domain";
  const isEmailBehavior = pageSlug === "email/behavior";
  const isEmailDelivery = pageSlug === "email/delivery";
  const isBillingPlans = pageSlug === "billing/plans";
  const isBillingCards = pageSlug === "billing/cards";
  const isBillingInvoices = pageSlug === "billing/invoices";
  const isWorkspaceIntegrations = pageSlug === "workspace/integrations";
  const isWorkspaceOperators = pageSlug === "workspace/operators";
  const isWorkspaceBilling = pageSlug === "workspace/billing";
  const isWorkspaceTransparency = pageSlug === "workspace/transparency";
  const isWorkspaceAdvanced = pageSlug === "workspace/advanced";
  const isWorkspaceData = pageSlug === "workspace/data";
  const isWorkspaceDanger = pageSlug === "workspace/danger";
  const isWorkspaceInformation = pageSlug === "workspace/information";
  const isAvailabilitySettings = isAvailabilityPage(pageSlug);
  const { toggles, loading: togglesLoading, error: togglesError, setToggle } = useSettingsToggles(
    pageSlug,
    config,
  );
  const {
    profile: accountProfile,
    loading: accountProfileLoading,
    error: accountProfileError,
    saving: profileSaving,
    updateField: updateProfileField,
    uploadAvatar,
    removeAvatar,
    requestEmailVerification,
    verificationSending,
    verificationMessage,
  } = useAccountProfile(isAccountInformation);
  const {
    loading: securityLoading,
    error: securityError,
    authorizedRows,
    historyRows,
    closeSession,
    closingSessionId,
  } = useAccountSecurity(isAccountSecurity);
  const {
    fields: interfaceFields,
    loading: interfaceLoading,
    error: interfaceError,
    saving: interfaceSaving,
    updateField: updateInterfaceField,
  } = useAccountInterface(isAccountInterface);
  const {
    groups: messageShortcutGroups,
    tags: messageShortcutTags,
    loading: messageShortcutsLoading,
    error: messageShortcutsError,
    saving: messageShortcutsSaving,
    formBang,
    formTag,
    formMessage,
    setFormBang,
    setFormTag,
    setFormMessage,
    canCreate: canCreateMessageShortcut,
    createShortcut,
    deleteShortcut,
    searchQuery: messageShortcutSearchQuery,
    setSearchQuery: setMessageShortcutSearchQuery,
  } = useMessageShortcuts(isInboxShortcuts);
  const {
    fields: inboxCustomizeFields,
    loading: inboxCustomizeFieldsLoading,
    error: inboxCustomizeFieldsError,
    saving: inboxCustomizeFieldSaving,
    updateField: updateInboxCustomizeField,
  } = useInboxCustomizeFields(isInboxCustomize);
  const {
    rulesForRuleset,
    activeCountForRuleset,
    loading: triageLoading,
    error: triageError,
    saving: triageSaving,
    searchQuery: triageSearchQuery,
    setSearchQuery: setTriageSearchQuery,
    actionFilter: triageActionFilter,
    setActionFilter: setTriageActionFilter,
    createRule: createTriageRule,
    deleteRule: deleteTriageRule,
    toggleRule: toggleTriageRule,
  } = useTriageRules(isInboxTriage);
  const {
    subInboxes,
    loading: subInboxesLoading,
    error: subInboxesError,
    saving: subInboxesSaving,
    createSubInbox,
    deleteSubInbox,
    toggleSubInbox,
    updateSubInbox,
  } = useSubInboxes(isInboxSubInboxes);
  const {
    rules: routingRules,
    loading: routingRulesLoading,
    error: routingRulesError,
    saving: routingRulesSaving,
    createRule: createRoutingRule,
    deleteRule: deleteRoutingRule,
    toggleRule: toggleRoutingRule,
  } = useRoutingRules(isInboxRouting);
  const {
    fields: chatboxAppearanceFields,
    loading: chatboxAppearanceLoading,
    error: chatboxAppearanceError,
    saving: chatboxAppearanceSaving,
    updateField: updateChatboxAppearanceField,
  } = useChatboxAppearanceFields(isChatboxAppearance);
  const {
    fields: chatboxBehaviorFields,
    loading: chatboxBehaviorLoading,
    error: chatboxBehaviorError,
    saving: chatboxBehaviorSaving,
    updateField: updateChatboxBehaviorField,
  } = useChatboxBehaviorFields(isChatboxBehavior);
  const {
    maxBytes: chatboxAttachmentMaxBytes,
    loading: chatboxAttachmentLoading,
    error: chatboxAttachmentError,
    saving: chatboxAttachmentSaving,
    save: saveChatboxAttachmentSettings,
  } = useChatboxAttachmentSettings(isChatboxBehavior);
  const {
    fields: chatboxSearchAiFields,
    loading: chatboxSearchAiFieldsLoading,
    error: chatboxSearchAiFieldsError,
    saving: chatboxSearchAiFieldSaving,
    updateField: updateChatboxSearchAiField,
  } = useChatboxSearchAiFields(isChatboxSearchAi);
  const {
    searches: searchAiFrequentSearches,
    overlayInstalled: searchAiOverlayInstalled,
    loading: searchAiFrequentSearchesLoading,
    error: searchAiFrequentSearchesError,
    saving: searchAiFrequentSearchesSaving,
    createSearch: createSearchAiFrequentSearch,
    deleteSearch: deleteSearchAiFrequentSearch,
  } = useSearchAiFrequentSearches(isChatboxSearchAi);
  const {
    restrictions: chatboxRestrictions,
    blockedPageRows,
    loading: chatboxRestrictionsLoading,
    error: chatboxRestrictionsError,
    saving: chatboxRestrictionsSaving,
    createRestriction,
    deleteRestriction,
    clearBlockedVisitors,
  } = useChatboxRestrictions(isChatboxRestrictions);
  const {
    fields: emailDomainFields,
    loading: emailDomainLoading,
    error: emailDomainError,
    saving: emailDomainSaving,
    updateField: updateEmailDomainField,
    verifyCustomDomain,
  } = useEmailDomainFields(isEmailDomain);
  const {
    fields: emailDeliveryFields,
    loading: emailDeliveryLoading,
    error: emailDeliveryError,
    saving: emailDeliverySaving,
    updateField: updateEmailDeliveryField,
    testing: emailDeliveryTesting,
    testResult: emailDeliveryTestResult,
    testConnection: testEmailDeliveryConnection,
  } = useEmailDeliveryFields(isEmailDelivery);
  const {
    enabled: emailSignatureEnabled,
    text: emailSignatureText,
    loading: emailSignatureLoading,
    error: emailSignatureError,
    saving: emailSignatureSaving,
    save: saveEmailSignature,
  } = useEmailSignature(isEmailBehavior);
  const {
    plans: billingPlans,
    monthlyTotalCents,
    hasPaymentMethod,
    loading: billingPlansLoading,
    error: billingPlansError,
    refresh: refreshBillingPlans,
  } = useBillingPlans(isBillingPlans);
  const billingMonthlyTotal = formatMonthlyTotal(monthlyTotalCents);
  const {
    cards: billingCards,
    loading: billingCardsLoading,
    error: billingCardsError,
    saving: billingCardsSaving,
    addCard: addBillingCard,
    removeCard: removeBillingCard,
  } = useBillingCards(isBillingCards);
  const {
    invoices: billingInvoices,
    loading: billingInvoicesLoading,
    error: billingInvoicesError,
    creating: creatingBillingInvoice,
    createInvoice,
    refresh: refreshBillingInvoices,
  } = useBillingInvoices(isBillingInvoices);
  const {
    workspaceId: integrationsWorkspaceId,
    intro: integrationsIntro,
    footerButton: integrationsFooterButton,
    categories: integrationCategories,
    htmlSnippet: integrationsHtmlSnippet,
    shopify: integrationsShopify,
    loading: workspaceIntegrationsLoading,
    error: workspaceIntegrationsError,
    refresh: refreshIntegrations,
  } = useWorkspaceIntegrations(isWorkspaceIntegrations);
  const {
    operators: workspaceOperators,
    supportOnline,
    loading: workspaceOperatorsLoading,
    error: workspaceOperatorsError,
    saving: workspaceOperatorsSaving,
    inviteOperator,
    removeOperator,
    updateOperatorRole,
  } = useWorkspaceOperators(isWorkspaceOperators);
  const {
    cards: workspaceBillingCards,
    selectedCard: workspaceSelectedCard,
    loading: workspaceBillingLoading,
    error: workspaceBillingError,
    saving: workspaceBillingSaving,
    setPaymentMethod: setWorkspacePaymentMethod,
    addCard: addWorkspaceBillingCard,
  } = useWorkspaceBilling(isWorkspaceBilling);
  const {
    auditRows: transparencyAuditRows,
    operatorOptions: transparencyOperatorOptions,
    actionOptions: transparencyActionOptions,
    operatorFilter: transparencyOperatorFilter,
    operatorLabel: transparencyOperatorLabel,
    actionFilter: transparencyActionFilter,
    setOperatorFilter: setTransparencyOperatorFilter,
    setActionFilter: setTransparencyActionFilter,
    dateFrom: transparencyDateFrom,
    dateTo: transparencyDateTo,
    setDateFrom: setTransparencyDateFrom,
    setDateTo: setTransparencyDateTo,
    loading: workspaceTransparencyLoading,
    error: workspaceTransparencyError,
  } = useWorkspaceTransparency(isWorkspaceTransparency);
  const {
    fields: workspaceAdvancedFields,
    tokens: workspaceApiTokens,
    webhooks: workspaceWebhooks,
    loading: workspaceAdvancedLoading,
    error: workspaceAdvancedError,
    saving: workspaceAdvancedSaving,
    fieldSaving: workspaceAdvancedFieldSaving,
    updateField: updateWorkspaceAdvancedField,
    createToken: createWorkspaceApiToken,
    deleteToken: deleteWorkspaceApiToken,
    createWebhook: createWorkspaceWebhook,
    deleteWebhook: deleteWorkspaceWebhook,
    toggleWebhook: toggleWorkspaceWebhook,
    testWebhook: testWorkspaceWebhook,
    testingWebhookId,
    webhookTestMessage,
  } = useWorkspaceAdvanced(isWorkspaceAdvanced);
  const {
    training: workspaceDataTraining,
    limitsByLabel: workspaceDataLimitsByLabel,
    contract: workspaceDataContract,
    loading: workspaceDataLoading,
    error: workspaceDataError,
    saving: workspaceDataSaving,
    startMagicReplyTraining,
    editLimit: editWorkspaceDataLimit,
    signContract: signWorkspaceDataContract,
  } = useWorkspaceData(isWorkspaceData);
  const {
    canLeave: canLeaveWorkspace,
    canDelete: canDeleteWorkspace,
    leaveBlockedReason,
    deleteBlockedReason,
    loading: workspaceDangerLoading,
    error: workspaceDangerError,
    saving: workspaceDangerSaving,
    leaveWorkspace,
    deleteWorkspace,
  } = useWorkspaceDanger(isWorkspaceDanger);
  const {
    profile: workspaceProfile,
    loading: workspaceProfileLoading,
    error: workspaceProfileError,
    saving: workspaceSaving,
    updateField: updateWorkspaceField,
    uploadLogo,
    removeLogo,
  } = useWorkspaceProfile(isWorkspaceInformation);
  const scheduleEnabled = toggles[AVAILABILITY_SCHEDULE_ENABLED_KEY] ?? false;
  const {
    schedule: availabilitySchedule,
    loading: scheduleLoading,
    error: scheduleError,
    saving: scheduleSaving,
    fieldsDisabled: scheduleFieldsDisabled,
    onPatch: patchAvailabilitySchedule,
  } = useAvailabilitySchedule(isAvailabilitySettings, scheduleEnabled);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const { user } = useSession();
  const loading =
    togglesLoading ||
    (isAccountInformation && accountProfileLoading) ||
    (isAccountSecurity && securityLoading) ||
    (isAccountInterface && interfaceLoading) ||
    (isInboxShortcuts && messageShortcutsLoading) ||
    (isInboxCustomize && inboxCustomizeFieldsLoading) ||
    (isInboxTriage && triageLoading) ||
    (isInboxSubInboxes && subInboxesLoading) ||
    (isInboxRouting && routingRulesLoading) ||
    (isChatboxAppearance && chatboxAppearanceLoading) ||
    (isChatboxBehavior && chatboxBehaviorLoading) ||
    (isChatboxSearchAi && (chatboxSearchAiFieldsLoading || searchAiFrequentSearchesLoading)) ||
    (isChatboxRestrictions && chatboxRestrictionsLoading) ||
    (isEmailDomain && emailDomainLoading) ||
    (isEmailDelivery && emailDeliveryLoading) ||
    (isBillingPlans && billingPlansLoading) ||
    (isBillingCards && billingCardsLoading) ||
    (isBillingInvoices && billingInvoicesLoading) ||
    (isWorkspaceIntegrations && workspaceIntegrationsLoading) ||
    (isWorkspaceOperators && workspaceOperatorsLoading) ||
    (isWorkspaceBilling && workspaceBillingLoading) ||
    (isWorkspaceTransparency && workspaceTransparencyLoading) ||
    (isWorkspaceAdvanced && workspaceAdvancedLoading) ||
    (isWorkspaceData && workspaceDataLoading) ||
    (isWorkspaceDanger && workspaceDangerLoading) ||
    (isWorkspaceInformation && workspaceProfileLoading) ||
    (isAvailabilitySettings && scheduleLoading);
  const error =
    togglesError ??
    accountProfileError ??
    securityError ??
    interfaceError ??
    messageShortcutsError ??
    inboxCustomizeFieldsError ??
    triageError ??
    subInboxesError ??
    routingRulesError ??
    chatboxAppearanceError ??
    chatboxBehaviorError ??
    chatboxSearchAiFieldsError ??
    searchAiFrequentSearchesError ??
    chatboxRestrictionsError ??
    emailDomainError ??
    emailDeliveryError ??
    billingPlansError ??
    billingCardsError ??
    billingInvoicesError ??
    workspaceIntegrationsError ??
    workspaceOperatorsError ??
    workspaceBillingError ??
    workspaceTransparencyError ??
    workspaceAdvancedError ??
    workspaceDataError ??
    workspaceDangerError ??
    workspaceProfileError ??
    scheduleError;
  const livePresence = user?.presence ?? "online";
  const showLiveAvailabilityBanner = isAvailabilitySettings && config.statusBanner;
  const showLiveOperatorsBanner = isWorkspaceOperators && config.statusBanner;
  const statusHighlight = showLiveAvailabilityBanner
    ? presenceBannerLabel(livePresence)
    : showLiveOperatorsBanner
      ? supportOnline
        ? "Online"
        : "Offline"
      : config.statusBanner?.titleHighlight;
  const statusHighlightOnline = showLiveAvailabilityBanner
    ? livePresence === "online"
    : showLiveOperatorsBanner
      ? supportOnline
      : true;
  const identityVerificationEnabled = isWorkspaceAdvanced ? (toggles["3-0"] ?? false) : false;

  const handleInstallPlugin = async (pluginId: string) => {
    setInstallingPluginId(pluginId);
    try {
      const response = await fetch(`/api/plugins/${pluginId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ installed: true }),
      });
      if (!response.ok) {
        throw new Error("Failed to install plugin");
      }
    } finally {
      setInstallingPluginId(null);
    }
  };

  const handleInstallPluginBanner = async () => {
    const pluginId = config.pluginBanner?.pluginId;
    if (!pluginId) return;
    await handleInstallPlugin(pluginId);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-white">
      <div
        className={cn(
          "flex justify-center py-8",
          config.chatboxPreview ? "px-8" : "px-[70px]",
        )}
      >
        <div
          className={cn(
            config.chatboxPreview
              ? "flex w-full max-w-[960px] items-start gap-8"
              : "w-full max-w-[710px]",
          )}
        >
        <div className={cn(config.chatboxPreview && "w-[500px] shrink-0", config.upgradeGate && "relative pb-[420px]")}>
        {error && (
          <p className="mb-4 rounded-lg border border-[#F4F4F5] bg-[#F8F9FB] px-4 py-2 text-sm text-[#828EA1]">
            {error}
          </p>
        )}
        {loading && (
          <p className="mb-4 text-sm text-[#828EA1]">Loading settings…</p>
        )}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-[40px] font-semibold leading-[44px] text-[#1c293b]">
              {config.title}
            </h2>
            {config.showHelp && (
              <a
                href={settingsHelpUrl(pageSlug)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#777f89] hover:text-[#1972F5]"
                aria-label="Open help article"
              >
                <CircleHelp size={24} strokeWidth={1.75} />
              </a>
            )}
          </div>
          {!config.hideSavedBadge && (
          <span className="ml-auto inline-flex shrink-0 items-center gap-2 rounded border border-[#E8EAEB] bg-[#F4F4F5] px-2 py-2 text-base text-[#2c405a]">
            <CircleCheck size={16} className="text-[#40B630]" strokeWidth={2.5} />
            Automatically Saved
          </span>
          )}
        </div>
        {config.description && (
          <p className="mt-2 pb-10 text-sm leading-relaxed text-[#75869c]">
            {config.description}
          </p>
        )}
        {!config.description && <div className="pb-10" />}

        {config.statusBanner && (
          <div
            className={cn(
              "mb-10 rounded border px-4 py-4",
              config.statusBanner.variant === "success"
                ? "border-[#B6EAAF] bg-[#F5FCEE]"
                : config.statusBanner.variant === "info"
                  ? "border-[#C5E4F7] bg-[#F3FAFE]"
                  : "border-[#FACA00] bg-[#FFF5CC]",
            )}
          >
            <div className="flex items-start gap-2 text-sm text-[#2c405a]">
              {config.statusBanner.variant === "info" ? (
                <CircleHelp
                  size={16}
                  className="mt-0.5 shrink-0 text-[#0093ee]"
                  strokeWidth={2}
                />
              ) : (
                <CircleCheck
                  size={16}
                  className={
                    config.statusBanner.variant === "success"
                      ? "mt-0.5 shrink-0 text-[#40B630]"
                      : "mt-0.5 shrink-0 text-[#FACA00]"
                  }
                  strokeWidth={2.5}
                />
              )}
              {config.statusBanner.inline ? (
                <div>
                  <div className="font-semibold text-[#1c293b]">
                    <span>{config.statusBanner.title} </span>
                    {config.statusBanner.highlightDot && (
                      <span
                        className={cn(
                          "mx-0.5 inline-block h-2 w-2 rounded-full align-middle",
                          statusHighlightOnline ? "bg-[#40B630]" : "bg-[#828EA1]",
                        )}
                      />
                    )}
                    {statusHighlight && (
                      <span
                        className={cn(
                          "font-extrabold",
                          statusHighlightOnline ? "text-[#40B630]" : "text-[#828EA1]",
                        )}
                      >
                        {statusHighlight}
                      </span>
                    )}
                  </div>
                  <span>{config.statusBanner.body}</span>
                </div>
              ) : config.statusBanner.paragraphs ? (
                <div className="w-full">
                  <div className="font-semibold text-[#1c293b]">
                    {config.statusBanner.title}
                  </div>
                  {config.statusBanner.paragraphs.map((paragraph, idx) => (
                    <p key={idx} className={cn("leading-relaxed", idx === 0 ? "mt-2.5" : "mt-2.5")}>
                      {paragraph.lead && (
                        <span className="font-semibold">{paragraph.lead} </span>
                      )}
                      {paragraph.text}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="w-full">
                  <div className="font-semibold text-[#1c293b]">
                    {config.statusBanner.title}{" "}
                    {statusHighlight && (
                      <span
                        className={cn(
                          "font-bold",
                          showLiveAvailabilityBanner && !statusHighlightOnline
                            ? "text-[#828EA1]"
                            : "text-[#40B630]",
                        )}
                      >
                        {statusHighlight}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 leading-relaxed">
                    {config.statusBanner.body}{" "}
                    {config.statusBanner.bodyBold && (
                      <span className="font-bold">{config.statusBanner.bodyBold}</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {isAccountInformation && accountProfile && !accountProfile.emailVerified ? (
          <div className="mb-10 flex items-center gap-4 rounded border border-[#FACA00] bg-[#FFF5CC] px-4 py-4 text-sm text-[#2c405a]">
            <AlertCircle size={16} className="shrink-0 text-[#FACA00]" fill="#FACA00" stroke="white" />
            <span>
              Your account email address has not been verified.{" "}
              <button
                type="button"
                className="font-bold text-[#2c405a] hover:underline disabled:opacity-60"
                disabled={verificationSending}
                onClick={() => void requestEmailVerification()}
              >
                Send an email now?
              </button>
              {verificationMessage && (
                <span className="mt-1 block text-xs font-medium text-[#606976]">
                  {verificationMessage}
                </span>
              )}
            </span>
          </div>
        ) : null}

        {!isAccountInformation &&
          config.alert &&
          (!isBillingPlans || !hasPaymentMethod) &&
          (!isBillingCards || billingCards.length === 0) && (
          <div className="mb-10 flex items-center gap-4 rounded border border-[#FACA00] bg-[#FFF5CC] px-4 py-4 text-sm text-[#2c405a]">
            <AlertCircle size={16} className="shrink-0 text-[#FACA00]" fill="#FACA00" stroke="white" />
            <span>
              {config.alert.text}
              {config.alert.action && (
                <>
                  {" "}
                  {config.alert.actionHref || isBillingPlans ? (
                    <Link
                      href={config.alert.actionHref ?? appSettingsPath("billing/cards")}
                      className="font-bold text-[#2c405a] hover:underline"
                    >
                      {config.alert.action}
                    </Link>
                  ) : (
                    <button type="button" className="font-bold text-[#2c405a] hover:underline">
                      {config.alert.action}
                    </button>
                  )}
                </>
              )}
            </span>
          </div>
        )}

        {config.pluginBanner && (
          <div className="mb-10 flex items-center justify-between gap-4 rounded bg-[#3F536E] px-4 py-3 text-sm text-white">
            <span className="min-w-0 truncate">{config.pluginBanner.text}</span>
            <button
              type="button"
              disabled={!config.pluginBanner.pluginId || installingPluginId !== null}
              onClick={() => void handleInstallPluginBanner()}
              className="shrink-0 rounded border border-[#E8EAEB] bg-[#F4F4F5] px-3 py-1.5 text-xs font-bold text-[#2c405a] disabled:opacity-60"
            >
              {installingPluginId ? "Installing…" : config.pluginBanner.button}
            </button>
          </div>
        )}

        {config.billingBanner && (
          <div className="mb-8 flex rounded border border-[#1972F5]/20 bg-[#1972F5]/[0.09] px-4 py-6">
            <div className="mr-6 shrink-0 rounded bg-[#1972F5] px-4 py-2 text-white">
              <span className="text-2xl leading-none">
                <span>
                  {isBillingPlans
                    ? billingMonthlyTotal.currency
                    : config.billingBanner.currency}
                </span>
                <span>
                  {isBillingPlans ? billingMonthlyTotal.amount : config.billingBanner.amount}
                </span>
                <span>
                  {isBillingPlans ? billingMonthlyTotal.cents : config.billingBanner.cents}
                </span>
              </span>
            </div>
            <div>
              <p className="text-lg font-extrabold text-[#1c293b]">
                {config.billingBanner.title}
              </p>
              <p className="mt-0.5 text-sm text-[#1c293b]">
                {config.billingBanner.description}
              </p>
            </div>
          </div>
        )}

        {isAccountSecurity ? <OAuthConnectedApps /> : null}

        {config.sections.map((section: PageSection, si: number) => {
          const sectionBadge =
            isWorkspaceAdvanced && si === 2
              ? { text: webhookCountLabel(workspaceWebhooks.length), tone: "grey" as const }
              : isWorkspaceAdvanced && si === 3
                ? identityVerificationEnabled
                  ? { text: "enabled", tone: "grey" as const, dot: true }
                  : { text: "disabled", tone: "orange" as const, dot: true }
                : section.badge;

          return (
          <div
            key={si}
            className={cn("mb-8", si > 0 && "mt-2")}
          >
            {section.title && (
              <div className="mb-6">
                <div
                  className={cn(
                    section.headerButton
                      ? "flex items-center justify-between gap-4"
                      : "flex items-center gap-2",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <h3 className="text-[18px] font-bold leading-7 text-[#1c293b]">
                      {section.title}
                    </h3>
                    {sectionBadge && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold capitalize",
                          sectionBadge.tone === "grey"
                            ? "bg-[#E8EAEB] text-[#606976]"
                            : "bg-[#F97316] text-white",
                        )}
                      >
                        {sectionBadge.dot && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                        {sectionBadge.text}
                      </span>
                    )}
                  </div>
                  {section.headerButton && (
                    <button
                      type="button"
                      disabled={
                        (isInboxSubInboxes && (subInboxesSaving || subInboxesLoading)) ||
                        (isInboxRouting && (routingRulesSaving || routingRulesLoading)) ||
                        (isWorkspaceAdvanced && (workspaceAdvancedSaving || workspaceAdvancedLoading))
                      }
                      onClick={
                        isInboxSubInboxes
                          ? () => void createSubInbox()
                          : isInboxRouting
                            ? () => void createRoutingRule()
                            : isWorkspaceAdvanced && si === 1
                              ? () => void createWorkspaceApiToken()
                              : isWorkspaceAdvanced && si === 2
                                ? () => void createWorkspaceWebhook()
                                : undefined
                      }
                      className={cn(
                        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded border px-3 text-[13px] font-bold",
                        section.headerButtonTone === "blue"
                          ? "border-[#1972F5] bg-white text-[#1972F5]"
                          : "border-black/10 bg-[#1972F5] text-white",
                      )}
                    >
                      {section.headerButton}
                      <Plus size={14} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
                {section.description && (
                  <p className="mt-2 text-sm leading-[22px] text-[#75869c]">
                    {section.description}
                  </p>
                )}
              </div>
            )}
            {!section.title && section.description && (
              <div className="mb-6">
                <p className="text-sm leading-[22px] text-[#75869c]">
                  {section.description}
                </p>
              </div>
            )}
            <div
              className={cn(
                section.columns === 2
                  ? "grid grid-cols-2 gap-x-6 gap-y-6"
                  : cn(
                      "flex flex-col",
                      section.gap === "none"
                        ? "gap-0"
                        : section.gap === "wide"
                          ? "gap-8"
                          : "gap-6",
                    ),
              )}
            >
              {section.items.map((item: SectionItem, ii: number) =>
                renderItem(
                  item,
                  si,
                  ii,
                  section.columns === 2,
                  toggles,
                  setToggle,
                  pageSlug,
                  isAccountInformation
                    ? {
                        profile: accountProfile,
                        avatarGradient: user?.avatarGradient ?? "from-violet-400 to-blue-500",
                        saving: profileSaving,
                        updateField: updateProfileField,
                        uploadAvatar,
                        removeAvatar,
                      }
                    : undefined,
                  isWorkspaceInformation
                    ? {
                        profile: workspaceProfile,
                        saving: workspaceSaving,
                        updateField: updateWorkspaceField,
                        uploadLogo,
                        removeLogo,
                      }
                    : undefined,
                  isAvailabilitySettings && availabilitySchedule
                    ? {
                        schedule: availabilitySchedule,
                        disabled: scheduleFieldsDisabled,
                        saving: scheduleSaving,
                        onPatch: patchAvailabilitySchedule,
                      }
                    : undefined,
                  isAccountInformation
                    ? { onOpenChangePassword: () => setChangePasswordOpen(true) }
                    : undefined,
                  isAccountSecurity
                    ? {
                        authorizedRows,
                        historyRows,
                        closeSession,
                        closingSessionId,
                      }
                    : undefined,
                  isAccountInterface
                    ? {
                        fields: interfaceFields,
                        saving: interfaceSaving,
                        updateField: updateInterfaceField,
                      }
                    : undefined,
                  isInboxShortcuts
                    ? {
                        tags: messageShortcutTags,
                        formBang,
                        formTag,
                        formMessage,
                        setFormBang,
                        setFormTag,
                        setFormMessage,
                        canCreate: canCreateMessageShortcut,
                        saving: messageShortcutsSaving,
                        createShortcut,
                        groups: messageShortcutGroups,
                        searchQuery: messageShortcutSearchQuery,
                        setSearchQuery: setMessageShortcutSearchQuery,
                        deleteShortcut,
                      }
                    : undefined,
                  isInboxCustomize
                    ? {
                        fields: inboxCustomizeFields,
                        saving: inboxCustomizeFieldSaving,
                        updateField: updateInboxCustomizeField,
                      }
                    : undefined,
                  isInboxTriage
                    ? {
                        rulesForRuleset,
                        activeCountForRuleset,
                        saving: triageSaving,
                        searchQuery: triageSearchQuery,
                        setSearchQuery: setTriageSearchQuery,
                        actionFilter: triageActionFilter,
                        setActionFilter: setTriageActionFilter,
                        createRule: createTriageRule,
                        deleteRule: deleteTriageRule,
                        toggleRule: toggleTriageRule,
                      }
                    : undefined,
                  isInboxSubInboxes
                    ? {
                        subInboxes,
                        saving: subInboxesSaving,
                        deleteSubInbox,
                        toggleSubInbox,
                        updateSubInbox,
                      }
                    : undefined,
                  isChatboxBehavior
                    ? {
                        maxBytes: chatboxAttachmentMaxBytes,
                        loading: chatboxAttachmentLoading,
                        error: chatboxAttachmentError,
                        saving: chatboxAttachmentSaving,
                        save: saveChatboxAttachmentSettings,
                      }
                    : undefined,
                  isInboxRouting
                    ? {
                        rules: routingRules,
                        saving: routingRulesSaving,
                        deleteRule: deleteRoutingRule,
                        toggleRule: toggleRoutingRule,
                      }
                    : undefined,
                  isChatboxAppearance
                    ? {
                        fields: chatboxAppearanceFields,
                        saving: chatboxAppearanceSaving,
                        updateField: updateChatboxAppearanceField,
                      }
                    : undefined,
                  isChatboxBehavior
                    ? {
                        fields: chatboxBehaviorFields,
                        saving: chatboxBehaviorSaving,
                        updateField: updateChatboxBehaviorField,
                      }
                    : undefined,
                  isChatboxSearchAi
                    ? {
                        searches: searchAiFrequentSearches,
                        overlayInstalled: searchAiOverlayInstalled,
                        defaultLanguage: chatboxSearchAiFields.defaultLanguage,
                        saving: searchAiFrequentSearchesSaving,
                        languageSaving: chatboxSearchAiFieldSaving === "defaultLanguage",
                        createSearch: createSearchAiFrequentSearch,
                        deleteSearch: deleteSearchAiFrequentSearch,
                        updateLanguage: (value) =>
                          updateChatboxSearchAiField("defaultLanguage", value),
                      }
                    : undefined,
                  searchAiOverlayInstalled,
                  isChatboxRestrictions
                    ? {
                        restrictions: chatboxRestrictions,
                        blockedPageRows,
                        saving: chatboxRestrictionsSaving,
                        createRestriction,
                        deleteRestriction,
                        clearBlockedVisitors,
                      }
                    : undefined,
                  isEmailDomain
                    ? {
                        fields: emailDomainFields,
                        saving: emailDomainSaving,
                        updateField: updateEmailDomainField,
                        verifyCustomDomain,
                      }
                    : undefined,
                  isEmailDelivery
                    ? {
                        fields: emailDeliveryFields,
                        saving: emailDeliverySaving,
                        updateField: updateEmailDeliveryField,
                        installingPluginId,
                        installPlugin: handleInstallPlugin,
                        testing: emailDeliveryTesting,
                        testResult: emailDeliveryTestResult,
                        testConnection: () => void testEmailDeliveryConnection(),
                      }
                    : undefined,
                  isBillingPlans
                    ? {
                        plans: billingPlans,
                        onPlanChanged: () => void refreshBillingPlans(),
                      }
                    : undefined,
                  isBillingCards
                    ? {
                        cards: billingCards,
                        saving: billingCardsSaving,
                        addCard: addBillingCard,
                        removeCard: removeBillingCard,
                      }
                    : undefined,
                  isBillingInvoices
                    ? {
                        invoices: billingInvoices,
                        creating: creatingBillingInvoice,
                        onCreateInvoice: () => void createInvoice(),
                        onInvoiceDeleted: () => void refreshBillingInvoices(),
                      }
                    : undefined,
                  isWorkspaceIntegrations
                    ? {
                        workspaceId: integrationsWorkspaceId,
                        htmlSnippet: integrationsHtmlSnippet,
                        intro: integrationsIntro,
                        footerButton: integrationsFooterButton,
                        categories: integrationCategories,
                        shopify: integrationsShopify,
                        refreshIntegrations,
                      }
                    : undefined,
                  isWorkspaceOperators
                    ? {
                        operators: workspaceOperators,
                        saving: workspaceOperatorsSaving,
                        inviteOperator,
                        removeOperator,
                        updateOperatorRole,
                      }
                    : undefined,
                  isWorkspaceBilling
                    ? {
                        cards: workspaceBillingCards,
                        selectedCard: workspaceSelectedCard,
                        saving: workspaceBillingSaving,
                        addCard: addWorkspaceBillingCard,
                        setPaymentMethod: setWorkspacePaymentMethod,
                      }
                    : undefined,
                  isWorkspaceTransparency
                    ? {
                        auditRows: transparencyAuditRows,
                        operatorOptions: transparencyOperatorOptions,
                        actionOptions: transparencyActionOptions,
                        operatorFilter: transparencyOperatorFilter,
                        operatorLabel: transparencyOperatorLabel,
                        actionFilter: transparencyActionFilter,
                        setOperatorFilter: setTransparencyOperatorFilter,
                        setActionFilter: setTransparencyActionFilter,
                        dateFrom: transparencyDateFrom,
                        dateTo: transparencyDateTo,
                        setDateFrom: setTransparencyDateFrom,
                        setDateTo: setTransparencyDateTo,
                      }
                    : undefined,
                  isWorkspaceAdvanced
                    ? {
                        fields: workspaceAdvancedFields,
                        tokens: workspaceApiTokens,
                        webhooks: workspaceWebhooks,
                        saving: workspaceAdvancedSaving,
                        fieldSaving: workspaceAdvancedFieldSaving,
                        updateField: updateWorkspaceAdvancedField,
                        deleteToken: deleteWorkspaceApiToken,
                        deleteWebhook: deleteWorkspaceWebhook,
                        toggleWebhook: toggleWorkspaceWebhook,
                        testWebhook: testWorkspaceWebhook,
                        testingWebhookId,
                        webhookTestMessage,
                      }
                    : undefined,
                  isWorkspaceData
                    ? {
                        training: workspaceDataTraining,
                        limitsByLabel: workspaceDataLimitsByLabel,
                        contract: workspaceDataContract,
                        saving: workspaceDataSaving,
                        startMagicReplyTraining,
                        editLimit: editWorkspaceDataLimit,
                        signContract: signWorkspaceDataContract,
                      }
                    : undefined,
                  isWorkspaceDanger
                    ? {
                        canLeave: canLeaveWorkspace,
                        canDelete: canDeleteWorkspace,
                        leaveBlockedReason,
                        deleteBlockedReason,
                        saving: workspaceDangerSaving,
                        leaveWorkspace,
                        deleteWorkspace,
                      }
                    : undefined,
                  isEmailBehavior
                    ? {
                        enabled: emailSignatureEnabled,
                        text: emailSignatureText,
                        loading: emailSignatureLoading,
                        error: emailSignatureError,
                        saving: emailSignatureSaving,
                        save: saveEmailSignature,
                      }
                    : undefined,
                ),
              )}
            </div>
          </div>
          );
        })}

        {(config.footerLink || config.footerNote) && (
          <p className="mt-6 flex flex-wrap gap-1 text-sm font-bold leading-[22px] text-[#1c293b]">
            {config.footerLink ? (
              <>
                <span>{config.footerLink.before}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (isAccountInformation) {
                      router.push(appSettingsPath("workspace/danger"));
                    }
                  }}
                  className={cn(
                    "font-bold",
                    config.footerLink.muted
                      ? "text-[#75869c] hover:underline"
                      : "text-[#1972F5] hover:underline",
                  )}
                >
                  {config.footerLink.link}
                </button>
                {config.footerLink.after}
              </>
            ) : (
              config.footerNote
            )}
          </p>
        )}

        {config.upgradeGate && <UpgradeGatePanel gate={config.upgradeGate} />}
        </div>
        {config.chatboxPreview && <ChatboxWidgetPreview />}
        </div>
      </div>
      <ChangePasswordModal open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
    </div>
  );
}

function UpgradeGatePanel({ gate }: { gate: PageUpgradeGate }) {
  const { openBilling, opening: upgrading, error } = useUpgradePlan();

  const handleUpgrade = () => {
    void openBilling();
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
      <div className="h-24 bg-gradient-to-b from-transparent to-white" />
      <div className="pointer-events-auto rounded-t-xl border border-[#E8EAEB] bg-white px-6 pb-6 pt-8 shadow-[0_-8px_32px_rgba(28,41,59,0.08)]">
        <h3 className="text-center text-[22px] font-bold leading-8 text-[#1c293b]">
          {gate.title}{" "}
          <span className="text-[#1972F5]">{gate.titleHighlight}</span>
        </h3>
        <div className="mt-6 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
          <div className="overflow-hidden rounded border border-[#E8EAEB]">
            <div className="flex items-center gap-2 border-b border-[#E8EAEB] bg-[#F8F9F9] px-3 py-2.5 text-sm font-semibold text-[#606976]">
              <Search size={16} strokeWidth={1.75} />
              Feature Details
            </div>
            <div className="bg-white p-4">
              <div className="space-y-2">
                <div className="rounded bg-[#1972F5] px-3 py-2 text-xs text-white">
                  Here you have the tutorial in video for Shopify: https://www.youtube.co…
                </div>
                <div className="rounded bg-[#E8EAEB] px-3 py-2 text-xs text-[#606976]">
                  Ici vous pourrez trouver la vidéo pour Shopify: https://www.youtube.co…
                </div>
              </div>
              <div className="mt-4 flex gap-4 border-t border-[#E8EAEB] pt-3 text-xs font-semibold text-[#75869c]">
                {["Note", "Reminder", "Shortcuts", "Helpdesk"].map((tab) => (
                  <span
                    key={tab}
                    className={cn(
                      tab === "Shortcuts" && "border-b-2 border-[#1972F5] pb-1 text-[#1972F5]",
                    )}
                  >
                    {tab}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div>
            <p className="text-base font-bold text-[#1c293b]">{gate.featureName}</p>
            <div className="mt-2 space-y-1">
              {gate.plans.map((plan) => (
                <p key={plan} className="text-sm font-semibold text-[#40B630]">
                  {plan}
                </p>
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#75869c]">{gate.description}</p>
            <ul className="mt-4 space-y-2">
              {gate.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2 text-sm text-[#2c405a]">
                  <CircleCheck size={16} className="mt-0.5 shrink-0 text-[#40B630]" strokeWidth={2.5} />
                  {bullet}
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled={upgrading}
              onClick={handleUpgrade}
              className="mt-5 inline-flex h-10 items-center rounded bg-[#1972F5] px-4 text-sm font-bold text-white disabled:opacity-60"
            >
              {upgrading ? "Upgrading…" : gate.button}
            </button>
            {error ? <p className="mt-2 text-sm text-[#EF4444]">{error}</p> : null}
            <div className="mt-4 flex gap-6 text-xs text-[#75869c]">
              {gate.footnotes.map((note) => (
                <span key={note}>{note}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatboxWidgetPreview() {
  return (
    <aside className="w-[400px] shrink-0">
      <p className="mb-4 text-sm text-[#2c405a]">
        <span className="font-bold">Preview</span> your widget:
      </p>
      <div className="relative h-[660px] overflow-hidden rounded border border-[#E8EAEB] bg-white">
        <div className="absolute bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#1970F0] shadow-md">
          <MessageCircle size={28} className="text-white" strokeWidth={1.75} />
        </div>
      </div>
      <div className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-[#75869c]">
        <Info size={14} className="mt-0.5 shrink-0" strokeWidth={2} />
        <span>
          This is a simulated chatbox. No message sent here will be delivered to your
          inbox. Only you see this.
        </span>
      </div>
    </aside>
  );
}

function renderItem(
  item: SectionItem,
  si: number,
  ii: number,
  inGrid: boolean,
  toggles: Record<string, boolean>,
  setToggle: (key: string, on: boolean) => void,
  pageSlug: string,
  profileContext?: {
    profile: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      avatarUrl: string;
    } | null;
    avatarGradient: string;
    saving: ProfileFieldKey | "avatar" | null;
    updateField: (field: ProfileFieldKey, value: string) => Promise<boolean>;
    uploadAvatar: (file: File) => Promise<boolean>;
    removeAvatar: () => Promise<boolean>;
  },
  workspaceContext?: {
    profile: {
      name: string;
      domain: string;
      logoUrl: string;
      initials: string;
      contactEmail: string;
      contactPhone: string;
      contactMessenger: string;
      contactTelegram: string;
      contactTwitter: string;
      contactWhatsapp: string;
      contactInstagram: string;
    } | null;
    saving: WorkspaceProfileFieldKey | "logo" | null;
    updateField: (field: WorkspaceProfileFieldKey, value: string) => Promise<boolean>;
    uploadLogo: (file: File) => Promise<boolean>;
    removeLogo: () => Promise<boolean>;
  },
  scheduleContext?: {
    schedule: AvailabilitySchedule;
    disabled: boolean;
    saving: boolean;
    onPatch: (patch: Partial<AvailabilitySchedule>) => Promise<boolean>;
  },
  changePasswordContext?: {
    onOpenChangePassword: () => void;
  },
  securityContext?: {
    authorizedRows: TableRowCell[][];
    historyRows: TableRowCell[][];
    closeSession: (sessionId: string) => Promise<boolean>;
    closingSessionId: string | null;
  },
  interfaceContext?: {
    fields: {
      language: string;
      appearance: string;
    };
    saving: InterfaceFieldKey | null;
    updateField: (field: InterfaceFieldKey, value: string) => Promise<boolean>;
  },
  messageShortcutsContext?: {
    tags: string[];
    formBang: string;
    formTag: string;
    formMessage: string;
    setFormBang: (value: string) => void;
    setFormTag: (value: string) => void;
    setFormMessage: (value: string) => void;
    canCreate: boolean;
    saving: boolean;
    createShortcut: () => Promise<boolean>;
    groups: import("@/types/message-shortcuts").MessageShortcutGroup[];
    searchQuery: string;
    setSearchQuery: (value: string) => void;
    deleteShortcut: (id: string) => Promise<boolean>;
  },
  inboxCustomizeContext?: {
    fields: {
      emailPreview: string;
    };
    saving: InboxCustomizeFieldKey | null;
    updateField: (field: InboxCustomizeFieldKey, value: string) => Promise<boolean>;
  },
  triageContext?: {
    rulesForRuleset: Record<TriageRuleset, import("@/types/triage").TriageRule[]>;
    activeCountForRuleset: Record<TriageRuleset, number>;
    saving: boolean;
    searchQuery: string;
    setSearchQuery: (value: string) => void;
    actionFilter: string;
    setActionFilter: (value: string) => void;
    createRule: (ruleset: TriageRuleset) => Promise<boolean>;
    deleteRule: (id: string) => Promise<boolean>;
    toggleRule: (id: string, enabled: boolean) => Promise<boolean>;
  },
  subInboxesContext?: {
    subInboxes: import("@/types/sub-inboxes").SubInbox[];
    saving: boolean;
    deleteSubInbox: (id: string) => Promise<boolean>;
    toggleSubInbox: (id: string, enabled: boolean) => Promise<boolean>;
    updateSubInbox: (
      id: string,
      patch: { name?: string; segment?: string | null },
    ) => Promise<boolean>;
  },
  chatboxAttachmentsContext?: {
    maxBytes: number;
    loading: boolean;
    error: string | null;
    saving: boolean;
    save: (maxBytes: number) => Promise<boolean>;
  },
  routingRulesContext?: {
    rules: import("@/types/routing-rules").RoutingRule[];
    saving: boolean;
    deleteRule: (id: string) => Promise<boolean>;
    toggleRule: (id: string, enabled: boolean) => Promise<boolean>;
  },
  chatboxAppearanceContext?: {
    fields: Record<ChatboxAppearanceFieldKey, string>;
    saving: ChatboxAppearanceFieldKey | null;
    updateField: (field: ChatboxAppearanceFieldKey, value: string) => Promise<boolean>;
  },
  chatboxBehaviorContext?: {
    fields: Record<ChatboxBehaviorFieldKey, string>;
    saving: ChatboxBehaviorFieldKey | null;
    updateField: (field: ChatboxBehaviorFieldKey, value: string) => Promise<boolean>;
  },
  searchAiContext?: {
    searches: import("@/types/search-ai").SearchAiFrequentSearch[];
    overlayInstalled: boolean;
    defaultLanguage: string;
    saving: boolean;
    languageSaving: boolean;
    createSearch: () => Promise<boolean>;
    deleteSearch: (id: string) => Promise<boolean>;
    updateLanguage: (value: string) => Promise<boolean>;
  },
  searchAiOverlayInstalled?: boolean,
  restrictionsContext?: {
    restrictions: import("@/types/chatbox-restrictions").ChatboxRestriction[];
    blockedPageRows: TableRowCell[][];
    saving: boolean;
    createRestriction: (
      kind: import("@/types/chatbox-restrictions").ChatboxRestrictionKind,
    ) => Promise<boolean>;
    deleteRestriction: (id: string) => Promise<boolean>;
    clearBlockedVisitors: () => Promise<boolean>;
  },
  emailDomainContext?: {
    fields: Record<EmailDomainFieldKey, string>;
    saving: EmailDomainFieldKey | null;
    updateField: (field: EmailDomainFieldKey, value: string) => Promise<boolean>;
    verifyCustomDomain: () => Promise<boolean>;
  },
  emailDeliveryContext?: {
    fields: Record<SmtpFieldKey, string>;
    saving: SmtpFieldKey | null;
    updateField: (field: SmtpFieldKey, value: string) => Promise<boolean>;
    installingPluginId: string | null;
    installPlugin: (pluginId: string) => Promise<void>;
    testing: boolean;
    testResult: EmailConnectionTestResult | null;
    testConnection: () => void;
  },
  billingPlansContext?: {
    plans: import("@/types/billing").WorkspacePlan[];
    onPlanChanged?: () => void | Promise<void>;
  },
  billingCardsContext?: {
    cards: import("@/types/billing").PaymentMethod[];
    saving: boolean;
    addCard: () => Promise<boolean>;
    removeCard: (id: string) => Promise<boolean>;
  },
  billingInvoicesContext?: {
    invoices: import("@/types/billing").BillingInvoice[];
    onInvoiceDeleted?: () => void | Promise<void>;
    creating?: boolean;
    onCreateInvoice?: () => void | Promise<void>;
  },
  workspaceIntegrationsContext?: {
    workspaceId: string;
    htmlSnippet: string;
    intro: string;
    footerButton: string;
    categories: import("@/types/workspace-integrations").IntegrationCategory[];
    shopify?: import("@/types/workspace-integrations").WorkspaceIntegrationsPayload["shopify"];
    refreshIntegrations?: () => Promise<import("@/types/workspace-integrations").WorkspaceIntegrationsPayload>;
  },
  workspaceOperatorsContext?: {
    operators: import("@/types/workspace-operators").WorkspaceOperator[];
    saving: boolean;
    inviteOperator: (email: string) => Promise<boolean>;
    removeOperator: (userId: string) => Promise<boolean>;
    updateOperatorRole: (userId: string, role: string) => Promise<boolean>;
  },
  workspaceBillingContext?: {
    cards: import("@/types/billing").PaymentMethod[];
    selectedCard: import("@/types/billing").PaymentMethod | null;
    saving: boolean;
    addCard: () => Promise<boolean>;
    setPaymentMethod: (paymentMethodId: string | null) => Promise<boolean>;
  },
  transparencyContext?: {
    auditRows: TableRowCell[][];
    operatorOptions: import("@/types/workspace-transparency").TransparencyOperatorOption[];
    actionOptions: string[];
    operatorFilter: string;
    operatorLabel: string;
    actionFilter: string;
    setOperatorFilter: (userId: string) => void;
    setActionFilter: (value: string) => void;
    dateFrom: string;
    dateTo: string;
    setDateFrom: (value: string) => void;
    setDateTo: (value: string) => void;
  },
  workspaceAdvancedContext?: {
    fields: import("@/lib/settings/workspace-advanced").WorkspaceAdvancedFields;
    tokens: import("@/types/workspace-advanced").WorkspaceApiToken[];
    webhooks: import("@/types/workspace-advanced").WorkspaceWebhook[];
    saving: boolean;
    fieldSaving: import("@/lib/settings/workspace-advanced").WorkspaceAdvancedFieldKey | null;
    updateField: (
      field: import("@/lib/settings/workspace-advanced").WorkspaceAdvancedFieldKey,
      value: string,
    ) => Promise<boolean>;
    deleteToken: (id: string) => Promise<boolean>;
    deleteWebhook: (id: string) => Promise<boolean>;
    toggleWebhook: (id: string, enabled: boolean) => Promise<boolean>;
    testWebhook: (id: string) => Promise<boolean>;
    testingWebhookId: string | null;
    webhookTestMessage: string | null;
  },
  workspaceDataContext?: {
    training: import("@/types/workspace-data").WorkspaceDataTraining;
    limitsByLabel: Record<string, import("@/types/workspace-data").WorkspaceDataLimit>;
    contract: import("@/types/workspace-data").WorkspaceDataContract;
    saving: boolean;
    startMagicReplyTraining: () => Promise<boolean>;
    editLimit: (key: import("@/types/workspace-data").WorkspaceDataLimitKey) => Promise<boolean>;
    signContract: () => Promise<boolean>;
  },
  workspaceDangerContext?: {
    canLeave: boolean;
    canDelete: boolean;
    leaveBlockedReason: string | null;
    deleteBlockedReason: string | null;
    saving: boolean;
    leaveWorkspace: () => Promise<boolean>;
    deleteWorkspace: () => Promise<boolean>;
  },
  emailSignatureContext?: {
    enabled: boolean;
    text: string;
    loading: boolean;
    error: string | null;
    saving: boolean;
    save: (value: { enabled: boolean; text: string }) => Promise<boolean>;
  },
) {
  const key = `${si}-${ii}`;

  switch (item.kind) {
    case "avatar":
      if (profileContext?.profile) {
        return (
          <AccountAvatarField
            key={key}
            help={item.help}
            avatarUrl={profileContext.profile.avatarUrl}
            avatarGradient={profileContext.avatarGradient}
            saving={profileContext.saving === "avatar"}
            onUpload={profileContext.uploadAvatar}
            onRemove={profileContext.removeAvatar}
          />
        );
      }

      return (
        <div
          key={key}
          className={cn("flex items-start gap-5", inGrid && "col-span-2")}
        >
          <div className="flex h-[120px] w-[120px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8EAEB] bg-[#F8F9F9]">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt=""
                className="h-[104px] w-[104px] rounded-full object-cover"
              />
            ) : (
              <div className="flex h-[104px] w-[104px] items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-blue-500 text-white">
                <PersonGlyph size={40} />
              </div>
            )}
          </div>
          <div className="pt-1">
            <p className="max-w-md text-sm font-medium leading-relaxed text-[#2c405a]">
              {item.help}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                className="inline-flex h-9 items-center rounded border border-black/10 bg-[#1972F5] px-4 text-[13px] font-bold text-white"
              >
                <Upload size={14} className="mr-1.5" />
                Upload image
              </button>
              <button
                type="button"
                className="h-[30px] rounded px-2 text-xs font-bold text-[#333e4f]"
              >
                Clear existing
              </button>
            </div>
          </div>
        </div>
      );

    case "imageField": {
      if (workspaceContext?.profile) {
        return (
          <WorkspaceLogoField
            key={key}
            label={item.label}
            instructions={item.instructions}
            button={item.button}
            logoUrl={workspaceContext.profile.logoUrl}
            initials={workspaceContext.profile.initials}
            saving={workspaceContext.saving === "logo"}
            onUpload={workspaceContext.uploadLogo}
            onRemove={workspaceContext.removeLogo}
          />
        );
      }

      return (
        <div
          key={key}
          className={cn("col-span-2 flex items-start gap-5", inGrid && "col-span-2")}
        >
          <div className="flex h-[120px] w-[120px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8EAEB] bg-[#F8F9F9]">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt=""
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-blue-500 text-white">
                <PersonGlyph size={32} />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-sm font-semibold text-[#1c293b]">
                {item.label}
              </span>
              <span className="text-sm font-semibold text-[#8d949d]">
                {item.instructions}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                className="inline-flex h-9 items-center rounded border border-black/10 bg-[#1972F5] px-4 text-[13px] font-bold text-white"
              >
                {item.button}
              </button>
              <button
                type="button"
                aria-label="Remove image"
                className="inline-flex h-[30px] w-[42px] items-center justify-center rounded border border-[#E8EAEB] bg-white text-[#333e4f]"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      );
    }

    case "field": {
      const emailDomainFieldKey = emailDomainFieldKeyForLabel(item.label);
      if (emailDomainContext && emailDomainFieldKey) {
        return (
          <EmailDomainField
            key={key}
            label={item.label}
            fieldKey={emailDomainFieldKey}
            value={emailDomainContext.fields[emailDomainFieldKey]}
            placeholder={item.placeholder}
            required={item.required}
            full={item.full}
            saving={emailDomainContext.saving === emailDomainFieldKey}
            onSave={emailDomainContext.updateField}
          />
        );
      }

      const smtpFieldKey = smtpFieldKeyForLabel(item.label);
      if (emailDeliveryContext && smtpFieldKey) {
        return (
          <SmtpSettingsField
            key={key}
            label={item.label}
            fieldKey={smtpFieldKey}
            value={emailDeliveryContext.fields[smtpFieldKey]}
            placeholder={item.placeholder}
            required={item.required}
            full={item.full}
            saving={emailDeliveryContext.saving === smtpFieldKey}
            onSave={emailDeliveryContext.updateField}
          />
        );
      }

      const workspaceFieldKey = workspaceFieldKeyForLabel(item.label);
      if (workspaceContext?.profile && workspaceFieldKey) {
        return (
          <WorkspaceProfileField
            key={key}
            label={item.label}
            fieldKey={workspaceFieldKey}
            value={workspaceContext.profile[workspaceFieldKey]}
            placeholder={item.placeholder}
            required={item.required}
            saving={workspaceContext.saving === workspaceFieldKey}
            onSave={workspaceContext.updateField}
          />
        );
      }

      const profileFieldKey = profileFieldKeyForLabel(item.label);
      if (profileContext?.profile && profileFieldKey) {
        return (
          <AccountProfileField
            key={key}
            label={item.label}
            fieldKey={profileFieldKey}
            value={profileContext.profile[profileFieldKey]}
            placeholder={item.placeholder}
            required={item.required}
            help={item.help}
            full={item.full}
            saving={profileContext.saving === profileFieldKey}
            onSave={profileContext.updateField}
          />
        );
      }

      return (
        <div key={key} className={cn(item.full && "col-span-2")}>
          <label className="mb-1.5 block text-sm font-bold text-[#606976]">
            {item.label}
            {item.required && <span className="text-[#606976]"> *</span>}
          </label>
          <div className="flex h-10 items-center rounded border border-[#E8EAEB] bg-[#F8F9F9]">
            <input
              defaultValue={item.value}
              placeholder={item.placeholder}
              className={cn(
                "h-full w-full rounded border-0 bg-transparent px-3 text-sm text-[#1c293b] outline-none placeholder:font-normal placeholder:text-[#828ea1]",
                item.value ? "font-bold" : "font-normal",
              )}
            />
          </div>
          {item.help && (
            <p className="mt-2.5 text-[13px] font-bold leading-[17px] text-[#8d949d]">
              {item.help}
            </p>
          )}
        </div>
      );
    }

    case "copyField":
      return (
        <CopyField
          key={key}
          item={item}
          inGrid={inGrid}
          valueOverride={
            workspaceIntegrationsContext && item.label === "Website ID"
              ? workspaceIntegrationsContext.workspaceId
              : workspaceIntegrationsContext && item.label === "Install code"
                ? workspaceIntegrationsContext.htmlSnippet
                : undefined
          }
        />
      );

    case "select":
      if (workspaceAdvancedContext) {
        const advancedFieldKey = workspaceAdvancedFieldKeyForLabel(item.label);
        if (advancedFieldKey && item.options) {
          return (
            <SettingsSelectField
              key={key}
              label={item.label}
              value={workspaceAdvancedContext.fields[advancedFieldKey]}
              options={item.options}
              variant={item.variant === "horizontal" ? "horizontal" : "default"}
              fieldWidth={item.fieldWidth}
              help={item.help}
              full={item.full}
              saving={workspaceAdvancedContext.fieldSaving === advancedFieldKey}
              onSave={(value) => workspaceAdvancedContext.updateField(advancedFieldKey, value)}
            />
          );
        }
      }

      if (chatboxBehaviorContext) {
        const behaviorFieldKey = chatboxBehaviorFieldKeyForLabel(item.label);
        if (behaviorFieldKey && item.options) {
          return (
            <SettingsSelectField
              key={key}
              label={item.label}
              value={chatboxBehaviorContext.fields[behaviorFieldKey]}
              options={item.options}
              variant={item.variant === "horizontal" ? "horizontal" : "default"}
              fieldWidth={item.fieldWidth}
              help={item.help}
              full={item.full}
              saving={chatboxBehaviorContext.saving === behaviorFieldKey}
              onSave={(value) => chatboxBehaviorContext.updateField(behaviorFieldKey, value)}
            />
          );
        }
      }

      if (chatboxAppearanceContext) {
        const appearanceFieldKey = chatboxAppearanceFieldKeyForLabel(item.label);
        if (appearanceFieldKey && item.options) {
          return (
            <SettingsSelectField
              key={key}
              label={item.label}
              value={chatboxAppearanceContext.fields[appearanceFieldKey]}
              options={item.options}
              variant={item.variant === "horizontal" ? "horizontal" : "default"}
              fieldWidth={item.fieldWidth}
              help={item.help}
              full={item.full}
              saving={chatboxAppearanceContext.saving === appearanceFieldKey}
              onSave={(value) => chatboxAppearanceContext.updateField(appearanceFieldKey, value)}
            />
          );
        }
      }

      if (inboxCustomizeContext) {
        const customizeFieldKey = inboxCustomizeFieldKeyForLabel(item.label);
        if (customizeFieldKey && item.options) {
          return (
            <SettingsSelectField
              key={key}
              label={item.label}
              value={inboxCustomizeContext.fields[customizeFieldKey]}
              options={item.options}
              variant={item.variant === "horizontal" ? "horizontal" : "default"}
              fieldWidth={item.fieldWidth}
              help={item.help}
              full={item.full}
              saving={inboxCustomizeContext.saving === customizeFieldKey}
              onSave={(value) => inboxCustomizeContext.updateField(customizeFieldKey, value)}
            />
          );
        }
      }

      if (interfaceContext) {
        const interfaceFieldKey = interfaceFieldKeyForLabel(item.label);
        if (interfaceFieldKey && item.options) {
          return (
            <InterfaceSelectField
              key={key}
              label={item.label}
              fieldKey={interfaceFieldKey}
              value={interfaceContext.fields[interfaceFieldKey]}
              options={item.options}
              help={item.help}
              full={item.full}
              saving={interfaceContext.saving === interfaceFieldKey}
              onSave={interfaceContext.updateField}
            />
          );
        }
      }

      if (item.variant === "horizontal" && item.label === "Timezone" && scheduleContext) {
        return (
          <AvailabilityTimezoneSelect
            key={key}
            schedule={scheduleContext.schedule}
            disabled={scheduleContext.disabled}
            saving={scheduleContext.saving}
            onPatch={scheduleContext.onPatch}
          />
        );
      }

      if (item.variant === "horizontal") {
        return (
          <div
            key={key}
            className={cn(
              "flex w-full items-center",
              item.disabled && "opacity-60",
              inGrid && "col-span-2",
            )}
          >
            <label className="w-[140px] shrink-0 pr-10 text-sm font-bold text-[#606976]">
              {item.label}
            </label>
            <div
              className="flex h-10 cursor-pointer items-center justify-between rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 text-sm font-bold text-[#1c293b]"
              style={{ width: item.fieldWidth ?? 340 }}
            >
              <span>{item.value}</span>
              <ChevronDown size={16} className="text-[#828ea1]" />
            </div>
          </div>
        );
      }

      return (
        <div key={key} className={cn(item.full && "col-span-2", item.disabled && "opacity-60")}>
          <label className="mb-1.5 block text-sm font-bold text-[#606976]">
            {item.label}
          </label>
          <div className="flex h-10 w-full cursor-pointer items-center justify-between rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 text-sm text-[#2c405a]">
            <span className={item.value ? "font-bold text-[#1c293b]" : undefined}>
              {item.value}
            </span>
            <ChevronDown size={16} className="text-[#828ea1]" />
          </div>
          {item.help && (
            <p className="mt-1.5 text-xs leading-relaxed text-[#828ea1]">{item.help}</p>
          )}
        </div>
      );

    case "dayTabs":
      if (scheduleContext) {
        return (
          <AvailabilityDayTabs
            key={key}
            schedule={scheduleContext.schedule}
            disabled={scheduleContext.disabled}
            saving={scheduleContext.saving}
            onPatch={scheduleContext.onPatch}
          />
        );
      }

      return (
        <div
          key={key}
          className={cn("w-full", item.disabled && "opacity-60", inGrid && "col-span-2")}
        >
          <label className="mb-2 block text-sm font-bold text-[#606976]">
            {item.label}
            {item.limit && (
              <span className="ml-1 font-bold text-[#606976]">{item.limit}</span>
            )}
          </label>
          <div className="flex flex-wrap gap-1">
            {item.days.map((day) => {
              const active = item.selected.includes(day);
              return (
                <span
                  key={day}
                  className={cn(
                    "inline-flex min-w-[44px] items-center justify-center rounded px-3 py-1.5 text-sm font-bold",
                    active
                      ? "bg-[#1972F5] text-white"
                      : "bg-[#F4F4F5] text-[#8d949d]",
                  )}
                >
                  {day}
                </span>
              );
            })}
          </div>
        </div>
      );

    case "hoursRow":
      if (scheduleContext) {
        return (
          <AvailabilityHoursRow
            key={key}
            schedule={scheduleContext.schedule}
            disabled={scheduleContext.disabled}
            saving={scheduleContext.saving}
            onPatch={scheduleContext.onPatch}
          />
        );
      }

      return (
        <div
          key={key}
          className={cn(
            "flex w-full items-center gap-3",
            item.disabled && "opacity-60",
            inGrid && "col-span-2",
          )}
        >
          <label className="w-[140px] shrink-0 pr-6 text-sm font-bold text-[#606976]">
            {item.label}
          </label>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {item.placeholders.map((placeholder, idx) => (
              <div
                key={idx}
                className="flex h-8 w-[52px] items-center justify-between rounded border border-[#E8EAEB] bg-[#F8F9F9] px-2 text-sm text-[#828ea1]"
              >
                <span>{placeholder}</span>
                <ChevronDown size={14} className="text-[#828ea1]" />
              </div>
            ))}
            <button
              type="button"
              disabled={item.disabled}
              className={cn(
                "ml-auto inline-flex h-[30px] shrink-0 items-center rounded border border-black/10 px-3 text-xs font-bold",
                item.disabled
                  ? "cursor-not-allowed bg-[#1972F5]/40 text-white"
                  : "bg-[#1972F5] text-white",
              )}
            >
              {item.button}
            </button>
          </div>
        </div>
      );

    case "entriesTable": {
      if (restrictionsContext && item.variant === "restrictions") {
        if (restrictionsContext.blockedPageRows.length === 0) {
          return null;
        }

        return (
          <EntriesTable
            key={key}
            item={{ ...item, rows: restrictionsContext.blockedPageRows }}
            inGrid={inGrid}
            onDeleteRestriction={restrictionsContext.deleteRestriction}
            deletingRestriction={restrictionsContext.saving}
          />
        );
      }

      if (transparencyContext && item.variant === "audit") {
        return (
          <EntriesTable
            key={key}
            item={{ ...item, rows: transparencyContext.auditRows }}
            inGrid={inGrid}
          />
        );
      }

      const rows =
        securityContext && si === 0
          ? securityContext.authorizedRows
          : securityContext && si === 1
            ? securityContext.historyRows
            : item.rows;

      return (
        <EntriesTable
          key={key}
          item={{ ...item, rows: rows.length > 0 ? rows : item.rows }}
          inGrid={inGrid}
          onCloseSession={securityContext?.closeSession}
          closingSessionId={securityContext?.closingSessionId ?? null}
        />
      );
    }

    case "colorTheme":
      return (
        <div key={key} className={cn("col-span-2")}>
          <label className="mb-2 block text-sm font-semibold text-[#2c405a]">
            {item.label}
          </label>
          <div className="flex flex-wrap items-center gap-2.5">
            {THEME_COLORS.map((color, idx) => (
              <button
                key={color}
                type="button"
                aria-label={`Theme color ${idx + 1}`}
                className={cn(
                  "h-8 w-8 rounded-full border-2 transition-transform hover:scale-105",
                  (item.selected === color || (idx === 0 && !item.selected)) &&
                    "ring-2 ring-offset-2 ring-[#1972F5]",
                )}
                style={{ backgroundColor: color, borderColor: color }}
              />
            ))}
          </div>
        </div>
      );

    case "divider":
      return (
        <hr
          key={key}
          className={cn(
            "border-0 border-t border-[#E6EAF0]",
            item.size === "large" ? "my-[30px]" : "my-1",
            inGrid && "col-span-2",
          )}
        />
      );

    case "buttonRow":
      if (
        item.variant === "horizontal" &&
        item.label === "Password" &&
        changePasswordContext
      ) {
        return (
          <div
            key={key}
            className={cn("flex w-full items-start", inGrid && "col-span-2")}
          >
            <p className="w-[140px] shrink-0 pr-10 text-sm font-bold leading-[34px] text-[#606976]">
              {item.label}
            </p>
            <button
              type="button"
              className="inline-flex h-9 shrink-0 items-center rounded border border-transparent bg-[#1972F5] px-3 text-[13px] font-bold text-white"
              onClick={changePasswordContext.onOpenChangePassword}
            >
              {item.button}
            </button>
          </div>
        );
      }

      if (item.variant === "horizontal") {
        const spread = item.layout === "spread";
        const restrictionKind =
          restrictionsContext && spread ? chatboxRestrictionKindForLabel(item.label) : null;
        const isClearBlockedVisitors =
          restrictionsContext && spread && item.label === "Blocked visitors";
        const buttonClass = cn(
          "inline-flex h-9 shrink-0 items-center rounded border px-3 text-[13px] font-bold",
          item.disabled || (restrictionsContext?.saving && spread)
            ? "cursor-not-allowed border-[#E6EAF0] bg-[#F4F5F7] text-[#A0A8B3]"
            : item.buttonTone === "blue"
              ? "border-[#1972F5] bg-white text-[#1972F5]"
              : item.buttonTone === "red"
                ? "border-[#E34850] bg-white text-[#E34850]"
                : item.primary
                  ? "border-transparent bg-[#1972F5] text-white"
                  : "border-[#E6EAF0] bg-white text-[#1c293b]",
        );

        return (
          <div
            key={key}
            className={cn(
              "flex w-full",
              spread ? "items-center justify-between gap-4" : "items-start",
              inGrid && "col-span-2",
            )}
          >
            <p
              className={cn(
                "text-sm font-bold text-[#606976]",
                spread
                  ? "min-w-0 flex-1"
                  : "w-[140px] shrink-0 pr-10 leading-[34px]",
              )}
            >
              {item.label}
            </p>
            <div className={item.helpBelow ? "min-w-0 flex-1" : undefined}>
              <button
                type="button"
                disabled={item.disabled || (restrictionsContext?.saving && spread)}
                className={buttonClass}
                onClick={
                  isClearBlockedVisitors
                    ? () => void restrictionsContext?.clearBlockedVisitors()
                    : restrictionKind
                      ? () => void restrictionsContext?.createRestriction(restrictionKind)
                      : undefined
                }
              >
                {item.button}
              </button>
              {item.help && item.helpBelow && (
                <p className="mt-[5px] text-sm font-normal leading-[22px] text-[#75869c]">
                  {item.help}
                </p>
              )}
            </div>
          </div>
        );
      }

      return (
        <div
          key={key}
          className={cn(
            "flex items-center justify-between gap-4 rounded-lg border border-[#E6EAF0] bg-[#FAFBFC] px-4 py-3.5",
            inGrid && "col-span-2",
          )}
        >
          <div>
            <p className="text-sm font-semibold text-[#2c405a]">{item.label}</p>
            {item.help && (
              <p className="mt-1 text-xs leading-relaxed text-[#828ea1]">{item.help}</p>
            )}
          </div>
          <button
            type="button"
            disabled={item.disabled}
            className={cn(
              "h-9 shrink-0 whitespace-nowrap rounded-lg px-4 text-sm font-semibold",
              item.disabled
                ? "cursor-not-allowed bg-[#1972F5]/40 text-white"
                : item.primary
                  ? "bg-[#1972F5] text-white"
                  : "border border-[#E6EAF0] bg-white text-[#1c293b]",
            )}
          >
            {item.button}
          </button>
        </div>
      );

    case "textarea":
      return (
        <div key={key} className={cn(item.full && "col-span-2")}>
          <label className="mb-1.5 block text-sm font-semibold text-[#2c405a]">
            {item.label}
          </label>
          <textarea
            defaultValue={item.value}
            rows={4}
            readOnly
            className="w-full resize-none rounded-lg border border-[#E8EAEB] bg-[#F8F9F9] px-3 py-2 font-mono text-xs leading-relaxed text-[#2c405a] outline-none focus:border-[#1972F5]"
          />
          {item.help && (
            <p className="mt-1.5 text-xs leading-relaxed text-[#828ea1]">{item.help}</p>
          )}
        </div>
      );

    case "note":
      return (
        <p
          key={key}
          className={cn("text-sm leading-relaxed text-[#5D6B98]", inGrid && "col-span-2")}
        >
          {item.text}
        </p>
      );

    case "sectionIntro":
      return (
        <div key={key} className={cn("flex flex-col gap-2", inGrid && "col-span-2")}>
          <h3 className="text-xl font-bold text-[#1c293b]">{item.title}</h3>
          <p className="text-sm text-[#75869c]">{item.description}</p>
        </div>
      );

    case "infoLines":
      return (
        <div key={key} className={cn("flex flex-col", inGrid && "col-span-2")}>
          {item.lines.map((line, li) => (
            <p
              key={li}
              className={cn(
                "text-sm leading-[22px] text-[#75869c]",
                line.bold ? "font-extrabold" : "font-normal",
              )}
            >
              {line.text}
            </p>
          ))}
        </div>
      );

    case "emptyState":
      if (workspaceAdvancedContext && item.variant === "block" && item.icon === "thunder") {
        return (
          <ApiTokensPanel
            key={key}
            tokens={workspaceAdvancedContext.tokens}
            saving={workspaceAdvancedContext.saving}
            emptyTitle={item.title}
            emptyDescription={item.description}
            onDelete={workspaceAdvancedContext.deleteToken}
          />
        );
      }
      if (workspaceAdvancedContext && item.variant === "block" && item.icon === "globe") {
        return (
          <WebhooksPanel
            key={key}
            webhooks={workspaceAdvancedContext.webhooks}
            saving={workspaceAdvancedContext.saving}
            emptyTitle={item.title}
            emptyDescription={item.description}
            onDelete={workspaceAdvancedContext.deleteWebhook}
            onToggle={workspaceAdvancedContext.toggleWebhook}
            onTest={workspaceAdvancedContext.testWebhook}
            testingId={workspaceAdvancedContext.testingWebhookId}
            testMessage={workspaceAdvancedContext.webhookTestMessage}
          />
        );
      }
      if (routingRulesContext) {
        return (
          <RoutingRulesPanel
            key={key}
            rules={routingRulesContext.rules}
            saving={routingRulesContext.saving}
            emptyTitle={item.title}
            emptyDescription={item.description}
            onDelete={routingRulesContext.deleteRule}
            onToggle={routingRulesContext.toggleRule}
          />
        );
      }
      if (subInboxesContext) {
        return (
          <SubInboxesPanel
            key={key}
            subInboxes={subInboxesContext.subInboxes}
            saving={subInboxesContext.saving}
            emptyTitle={item.title}
            emptyDescription={item.description}
            onDelete={subInboxesContext.deleteSubInbox}
            onToggle={subInboxesContext.toggleSubInbox}
            onUpdate={subInboxesContext.updateSubInbox}
          />
        );
      }
      if (item.variant === "mini") {
        return (
          <div
            key={key}
            className={cn(
              "rounded border border-[#E8EAEB] px-2.5 py-3.5 text-center",
              inGrid && "col-span-2",
            )}
          >
            <p className="text-sm font-medium text-[#1c293b]">{item.title}</p>
            <p className="mt-1 text-sm text-[#75869c]">{item.description}</p>
          </div>
        );
      }
      if (item.variant === "block") {
        const Icon =
          item.icon === "globe" ? Globe : item.icon === "eye" ? Eye : Zap;
        return (
          <div
            key={key}
            className={cn(
              "flex flex-col items-center rounded border border-[#E8EAEB] px-2.5 py-3.5 text-center",
              inGrid && "col-span-2",
            )}
          >
            <Icon size={20} className="mb-2 text-[#1c293b]" strokeWidth={1.75} />
            <p className="text-sm font-medium text-[#1c293b]">{item.title}</p>
            <p className="mt-1 text-sm text-[#75869c]">{item.description}</p>
          </div>
        );
      }
      return (
        <div
          key={key}
          className={cn(
            "mt-[69px] flex flex-col items-center px-[50px] text-center",
            inGrid && "col-span-2",
          )}
        >
          <p className="mb-2.5 text-base font-extrabold leading-[26px] text-[#1c293b]">
            {item.title}
          </p>
          <p className="mb-5 text-sm leading-[22px] text-[#75869c]">
            {item.description}
          </p>
        </div>
      );

    case "iconButton":
      return (
        <button
          key={key}
          type="button"
          className={cn(
            "inline-flex h-[43px] items-center gap-2 rounded border border-black/10 bg-[#1972F5] px-4 text-sm font-bold text-white",
            inGrid && "col-span-2",
          )}
        >
          {item.icon === "CreditCard" && (
            <CreditCard size={16} className="shrink-0" strokeWidth={2} />
          )}
          {item.label}
        </button>
      );

    case "billingInvoicesPanel":
      if (billingInvoicesContext) {
        return (
          <BillingInvoicesPanel
            key={key}
            invoices={billingInvoicesContext.invoices}
            emptyTitle={item.emptyTitle}
            emptyDescription={item.emptyDescription}
            creating={billingInvoicesContext.creating}
            onCreateInvoice={billingInvoicesContext.onCreateInvoice}
            onInvoiceDeleted={billingInvoicesContext.onInvoiceDeleted}
          />
        );
      }
      return null;

    case "billingCardsPanel":
      if (billingCardsContext) {
        return (
          <BillingCardsPanel
            key={key}
            cards={billingCardsContext.cards}
            saving={billingCardsContext.saving}
            onAdd={billingCardsContext.addCard}
            onRemove={billingCardsContext.removeCard}
          />
        );
      }
      return null;

    case "billingPlansPanel":
      if (billingPlansContext) {
        return (
          <BillingPlansPanel
            key={key}
            plans={billingPlansContext.plans}
            onPlanChanged={billingPlansContext.onPlanChanged}
          />
        );
      }
      return null;

    case "emailSignature":
      if (emailSignatureContext) {
        return (
          <EmailSignaturePanel
            key={`${emailSignatureContext.enabled}-${emailSignatureContext.text}`}
            enabled={emailSignatureContext.enabled}
            text={emailSignatureContext.text}
            loading={emailSignatureContext.loading}
            saving={emailSignatureContext.saving}
            error={emailSignatureContext.error}
            onSave={emailSignatureContext.save}
          />
        );
      }
      return null;

    case "chatboxAttachments":
      if (chatboxAttachmentsContext) {
        return (
          <ChatboxAttachmentsPanel
            key={chatboxAttachmentsContext.maxBytes}
            maxBytes={chatboxAttachmentsContext.maxBytes}
            loading={chatboxAttachmentsContext.loading}
            saving={chatboxAttachmentsContext.saving}
            error={chatboxAttachmentsContext.error}
            onSave={chatboxAttachmentsContext.save}
          />
        );
      }
      return null;

    case "workspacePlan":
      return (
        <div key={key} className={cn(inGrid && "col-span-2")}>
          <div className="mb-6 flex items-center gap-3">
            <img
              src={item.avatarUrl}
              alt=""
              className="h-[30px] w-[30px] rounded-full object-cover"
            />
            <span className="text-lg font-bold text-[#1c293b]">{item.name}</span>
            <span className="rounded bg-[#0093ee] px-2 py-1 text-xs font-bold text-white">
              {item.planTag}
            </span>
          </div>
          <div className="mb-4 flex rounded-lg border border-[#E8EAEB] bg-white p-6">
            <div className="min-w-0 flex-1">
              <p className="text-[40px] font-semibold leading-[44px] text-[#2c405a]">
                {item.amount}
              </p>
              <p className="text-xs font-semibold text-[#8d949d]">{item.period}</p>
            </div>
            <div className="flex min-w-0 flex-col items-start">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#EBF6ED] px-[5px] py-[2px] text-[12.5px] font-bold text-[#39A746]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#39A746]" />
                {item.status}
              </span>
              <div className="mt-[21px] flex items-center gap-1 text-sm text-[#8d949d]">
                <UserRound size={20} className="shrink-0" strokeWidth={1.75} />
                <span>Billing owner</span>
                <span className="truncate">{item.billingOwner}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex h-[36px] items-center rounded border border-black/10 bg-[#1972F5] px-4 text-[13px] font-bold text-white"
          >
            {item.button}
          </button>
        </div>
      );

    case "linkRow":
      if (item.variant === "actionButton" && item.action) {
        return (
          <div
            key={key}
            className={cn("flex items-center", inGrid && "col-span-2")}
          >
            <span className="w-[140px] shrink-0 text-sm font-bold text-[#606976]">
              {item.label}
            </span>
            <button
              type="button"
              onClick={() => {
                if (item.action === "Chatbox setup instructions") {
                  window.open(appWidgetUrl(), "_blank", "noopener,noreferrer");
                  return;
                }
                if (item.href && item.href !== "#") {
                  window.location.assign(item.href);
                }
              }}
              className="inline-flex h-[37px] items-center gap-2 rounded border border-black/10 bg-[#1972F5] px-3 text-[13px] font-bold text-white"
            >
              <ArrowRight size={14} strokeWidth={2.5} />
              {item.action}
            </button>
          </div>
        );
      }
      if (item.variant === "horizontal" && item.action) {
        return (
          <div
            key={key}
            className={cn(
              "flex min-h-[34px] items-center justify-between",
              inGrid && "col-span-2",
            )}
          >
            <span className="pr-10 text-sm font-bold text-[#606976]">{item.label}</span>
            <a
              href={item.href}
              className="text-sm font-semibold text-[#0093ee] hover:underline"
            >
              {item.action}
            </a>
          </div>
        );
      }
      if (item.variant === "external") {
        return (
          <a
            key={key}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-1 text-[13px] font-semibold text-[#0093ee] hover:underline",
              inGrid && "col-span-2",
            )}
          >
            {item.label}
            <ExternalLink size={12} strokeWidth={2} />
          </a>
        );
      }
      return (
        <a
          key={key}
          href={item.href}
          className="text-sm font-semibold text-[#1972F5] hover:underline"
        >
          {item.label}
        </a>
      );

    case "upgradeLinkRow":
      return (
        <div
          key={key}
          className={cn("flex w-full items-center", inGrid && "col-span-2")}
        >
          <label className="w-[145px] shrink-0 pr-10 text-sm font-bold text-[#606976]">
            {item.label}
          </label>
          <div className="flex min-w-0 flex-1 justify-end">
            <Link
              href={item.href}
              className="text-sm font-semibold text-[#0093ee] hover:underline"
            >
              {item.link}
            </Link>
          </div>
        </div>
      );

    case "frequentSearchesPanel":
      if (searchAiContext) {
        return (
          <FrequentSearchesPanel
            key={key}
            title={item.title}
            description={item.description}
            addButton={item.addButton}
            emptyText={item.emptyText}
            searches={searchAiContext.searches}
            defaultLanguage={searchAiContext.defaultLanguage}
            overlayInstalled={searchAiContext.overlayInstalled}
            saving={searchAiContext.saving}
            languageSaving={searchAiContext.languageSaving}
            onAdd={searchAiContext.createSearch}
            onDelete={searchAiContext.deleteSearch}
            onLanguageChange={searchAiContext.updateLanguage}
          />
        );
      }

      return (
        <div
          key={key}
          className={cn("overflow-hidden rounded border border-[#E3E8EF] bg-white", inGrid && "col-span-2")}
        >
          <div className="flex items-center gap-2 border-b border-[#E3E8EF] px-4 py-3">
            <List size={17} className="shrink-0 text-[#606976]" strokeWidth={1.75} />
            <span className="truncate text-sm font-semibold text-[#2c405a]">{item.title}</span>
          </div>
          <div className="px-4 py-4">
            <p className="text-sm leading-relaxed text-[#75869c]">{item.description}</p>
            <p className="mt-8 text-center text-sm font-semibold text-[#75869c]">
              {item.emptyText}
            </p>
          </div>
        </div>
      );

    case "statusButtonRow":
      return (
        <div
          key={key}
          className={cn(
            "flex w-full items-center justify-between gap-4",
            inGrid && "col-span-2",
          )}
        >
          <label className="min-w-0 flex-1 text-sm font-bold text-[#606976]">
            {item.label}
          </label>
          <button
            type="button"
            className={cn(
              "inline-flex h-9 shrink-0 items-center rounded border px-3 text-xs font-bold",
              item.variant === "green"
                ? "border-[#39A746] bg-white text-[#39A746]"
                : "border-[#1c293b] bg-white text-[#1c293b]",
            )}
          >
            {item.button}
          </button>
        </div>
      );

    case "integrationCatalog": {
      const catalogItem = workspaceIntegrationsContext
        ? {
            ...item,
            intro: workspaceIntegrationsContext.intro || item.intro,
            footerButton: workspaceIntegrationsContext.footerButton || item.footerButton,
            categories: workspaceIntegrationsContext.categories,
          }
        : item;
      return (
        <>
          {workspaceIntegrationsContext?.shopify ? (
            <ShopifyIntegrationPanel
              shopify={workspaceIntegrationsContext.shopify}
              onRefresh={workspaceIntegrationsContext.refreshIntegrations}
            />
          ) : null}
          <IntegrationCatalog
            key={key}
            item={catalogItem}
            inGrid={inGrid}
            onChannelClick={(channel) => {
              if (
                channel.name === "Shopify" &&
                workspaceIntegrationsContext?.shopify?.installUrl
              ) {
                window.open(workspaceIntegrationsContext.shopify.installUrl, "_blank", "noopener");
                return;
              }
              window.location.assign(APP_PLUGINS_PATH);
            }}
            onFooterClick={() => {
              window.location.assign(APP_PLUGINS_PATH);
            }}
          />
        </>
      );
    }

    case "operatorsPanel":
      if (workspaceOperatorsContext) {
        return (
          <WorkspaceOperatorsPanel
            key={key}
            addButton={item.addButton}
            sortButton={item.sortButton}
            clearButton={item.clearButton}
            operators={workspaceOperatorsContext.operators}
            saving={workspaceOperatorsContext.saving}
            onInvite={workspaceOperatorsContext.inviteOperator}
            onRemove={workspaceOperatorsContext.removeOperator}
            onUpdateRole={workspaceOperatorsContext.updateOperatorRole}
          />
        );
      }
      return null;

    case "billingPaymentGroup":
      if (workspaceBillingContext) {
        return (
          <WorkspaceBillingPanel
            key={key}
            addButton={item.addButton}
            actionsTitle={item.actionsTitle}
            actionsLink={item.actionsLink}
            actionsHref={item.actionsHref}
            cards={workspaceBillingContext.cards}
            selectedCard={workspaceBillingContext.selectedCard}
            saving={workspaceBillingContext.saving}
            onAdd={workspaceBillingContext.addCard}
            onSelect={workspaceBillingContext.setPaymentMethod}
          />
        );
      }
      return (
        <div
          key={key}
          className={cn("flex items-start", inGrid && "col-span-2")}
        >
          <button
            type="button"
            className="inline-flex h-[43px] items-center gap-2 rounded border border-black/10 bg-[#1972F5] px-4 text-sm font-bold text-white"
          >
            <CreditCard size={16} strokeWidth={2} />
            {item.addButton}
          </button>
          <div className="ml-10 pl-4">
            <p className="text-sm font-bold text-[#75869c]">{item.actionsTitle}</p>
            <a
              href={item.actionsHref}
              className="mt-1 inline-block text-sm font-bold text-[#0093ee] hover:underline"
            >
              {item.actionsLink}
            </a>
          </div>
        </div>
      );

    case "auditFilters":
      if (transparencyContext) {
        return (
          <AuditFiltersBar
            key={key}
            operator={transparencyContext.operatorLabel}
            action={transparencyContext.actionFilter}
            operatorOptions={transparencyContext.operatorOptions}
            actionOptions={transparencyContext.actionOptions}
            dateFrom={transparencyContext.dateFrom}
            dateTo={transparencyContext.dateTo}
            dateDisabled={item.disabled}
            onOperatorChange={transparencyContext.setOperatorFilter}
            onActionChange={transparencyContext.setActionFilter}
            onDateFromChange={transparencyContext.setDateFrom}
            onDateToChange={transparencyContext.setDateTo}
          />
        );
      }

      return (
        <div key={key} className={cn("mb-6 w-full", inGrid && "col-span-2", item.disabled && "opacity-60")}>
          <label className="mb-2 block text-sm font-bold text-[#606976]">Filter by</label>
          <div className="flex gap-2">
            <div className="flex h-10 w-[313px] shrink-0 items-center rounded border border-[#E8EAEB] bg-[#F8F9F9] px-2 text-sm text-[#828ea1]">
              <Calendar size={20} className="mr-2 shrink-0 text-[#606976]" strokeWidth={1.75} />
              <span className="font-normal">{item.dateFrom}</span>
              <span className="mx-1">-</span>
              <span className="font-normal">{item.dateTo}</span>
            </div>
            <div className="flex min-w-0 flex-1 gap-2">
              <div className="flex h-10 min-w-0 flex-1 cursor-pointer items-center justify-between rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 text-sm font-bold text-[#1c293b]">
                <span className="flex min-w-0 items-center gap-2 truncate">
                  <UserRound size={20} className="shrink-0 text-[#606976]" strokeWidth={1.75} />
                  {item.operator}
                </span>
                <ChevronDown size={16} className="shrink-0 text-[#828ea1]" />
              </div>
              <div className="flex h-10 min-w-0 flex-1 cursor-pointer items-center justify-between rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 text-sm font-bold text-[#1c293b]">
                <span className="flex min-w-0 items-center gap-2 truncate">
                  <Plus size={20} className="shrink-0 text-[#606976]" strokeWidth={1.75} />
                  {item.action}
                </span>
                <ChevronDown size={16} className="shrink-0 text-[#828ea1]" />
              </div>
            </div>
          </div>
        </div>
      );

    case "triageFilters":
      if (triageContext && item.actionOptions) {
        return (
          <TriageFiltersBar
            key={key}
            label={item.label}
            searchPlaceholder={item.searchPlaceholder}
            actionOptions={item.actionOptions}
            query={triageContext.searchQuery}
            actionFilter={triageContext.actionFilter}
            saving={triageContext.saving}
            onQueryChange={triageContext.setSearchQuery}
            onActionFilterChange={triageContext.setActionFilter}
          />
        );
      }

      return (
        <div key={key} className={cn("mb-6 w-full", inGrid && "col-span-2")}>
          <label className="mb-2 block text-sm font-bold text-[#606976]">{item.label}</label>
          <div className="flex gap-2">
            <div className="flex h-9 min-w-0 flex-1 items-center rounded border border-[#E8EAEB] bg-[#F8F9F9] px-2">
              <Search size={20} className="mr-2 shrink-0 text-[#606976]" strokeWidth={1.75} />
              <input
                type="text"
                readOnly
                placeholder={item.searchPlaceholder}
                className="min-w-0 flex-1 bg-transparent text-sm text-[#1c293b] outline-none placeholder:text-[#828ea1]"
              />
            </div>
            <div className="flex h-9 w-[200px] shrink-0 cursor-pointer items-center justify-between rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 text-sm font-bold text-[#1c293b]">
              <span>{item.actionValue}</span>
              <ChevronDown size={16} className="shrink-0 text-[#828ea1]" />
            </div>
          </div>
        </div>
      );

    case "triageRuleset": {
      if (triageContext) {
        return (
          <TriageRulesetSection
            key={key}
            ruleset={item.ruleset}
            title={item.title}
            addButton={item.addButton}
            emptyTitle={item.emptyTitle}
            emptyDescription={item.emptyDescription}
            rules={triageContext.rulesForRuleset[item.ruleset]}
            activeCount={triageContext.activeCountForRuleset[item.ruleset]}
            saving={triageContext.saving}
            disclaimer={item.disclaimer}
            onAdd={triageContext.createRule}
            onDelete={triageContext.deleteRule}
            onToggle={triageContext.toggleRule}
          />
        );
      }

      const RulesetIcon = item.ruleset === "block" ? Ban : ListFilter;
      return (
        <div key={key} className={cn("w-full", inGrid && "col-span-2")}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2">
              <RulesetIcon size={18} className="shrink-0 text-[#75869c]" strokeWidth={1.75} />
              <h3 className="text-[18px] font-bold leading-7 text-[#1c293b]">{item.title}</h3>
              <span className="text-sm font-normal text-[#75869c]">{item.activeCount}</span>
            </div>
            <button
              type="button"
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded border border-[#1972F5] bg-white px-3 text-[13px] font-bold text-[#1972F5]"
            >
              {item.addButton}
              <Plus size={14} strokeWidth={2.5} />
            </button>
          </div>
          {item.disclaimer && (
            <div className="mt-4 rounded border border-[#FDE0B5] bg-[#FFF8EE] px-4 py-4">
              <div className="flex items-start gap-2 text-sm text-[#2c405a]">
                <AlertTriangle
                  size={16}
                  className="mt-0.5 shrink-0 text-[#FD7B1F]"
                  strokeWidth={2}
                />
                <div>
                  <p className="font-semibold text-[#1c293b]">{item.disclaimer.title}</p>
                  <p className="mt-2.5 leading-relaxed">
                    {item.disclaimer.body}{" "}
                    {item.disclaimer.bodyBold && (
                      <span className="font-semibold">{item.disclaimer.bodyBold}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="mt-4">
            <div className="rounded border border-[#E8EAEB] px-2.5 py-3.5 text-center">
              <p className="text-sm font-medium text-[#1c293b]">{item.emptyTitle}</p>
              <p className="mt-1 text-sm text-[#75869c]">{item.emptyDescription}</p>
            </div>
          </div>
        </div>
      );
    }

    case "shortcutsInputRow":
      if (messageShortcutsContext) {
        return (
          <div key={key} className={cn("w-full", inGrid && "col-span-2")}>
            <MessageShortcutFields
              bang={messageShortcutsContext.formBang}
              tag={messageShortcutsContext.formTag}
              tags={messageShortcutsContext.tags}
              saving={messageShortcutsContext.saving}
              onBangChange={messageShortcutsContext.setFormBang}
              onTagChange={messageShortcutsContext.setFormTag}
            />
          </div>
        );
      }

      return (
        <div key={key} className={cn("flex gap-6", inGrid && "col-span-2")}>
          <div className="min-w-0 flex-1">
            <label className="mb-1.5 block text-sm font-bold text-[#606976]">
              {item.shortcutLabel}
              <span className="text-[#606976]"> *</span>
            </label>
            <div className="flex h-10 items-center rounded border border-[#E8EAEB] bg-[#F8F9F9]">
              <input
                readOnly
                placeholder={item.shortcutPlaceholder}
                className="h-full w-full rounded border-0 bg-transparent px-3 text-sm font-normal text-[#1c293b] outline-none placeholder:text-[#828ea1]"
              />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <label className="mb-1.5 block text-sm font-bold text-[#606976]">
              {item.tagLabel}
            </label>
            <div className="flex h-10 cursor-pointer items-center justify-between rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 text-sm text-[#828ea1]">
              <span>{item.tagPlaceholder}</span>
              <ChevronDown size={16} className="shrink-0 text-[#828ea1]" />
            </div>
          </div>
        </div>
      );

    case "messageComposer":
      if (messageShortcutsContext) {
        return (
          <div key={key} className={cn("w-full", inGrid && "col-span-2")}>
            <label className="mb-1.5 block text-sm font-bold text-[#606976]">{item.label}</label>
            <div className="overflow-hidden rounded border border-[#E8EAEB] bg-[#F8F9F9]">
              <textarea
                value={messageShortcutsContext.formMessage}
                disabled={messageShortcutsContext.saving}
                placeholder={item.placeholder}
                onChange={(event) => messageShortcutsContext.setFormMessage(event.target.value)}
                className="min-h-[150px] w-full resize-none border-0 bg-transparent px-3 py-3 text-sm text-[#1c293b] outline-none placeholder:text-[#828ea1]"
              />
            </div>
          </div>
        );
      }

      return (
        <div key={key} className={cn("w-full", inGrid && "col-span-2")}>
          <label className="mb-1.5 block text-sm font-bold text-[#606976]">{item.label}</label>
          <div className="overflow-hidden rounded border border-[#E8EAEB] bg-[#F8F9F9]">
            <textarea
              readOnly
              placeholder={item.placeholder}
              className="min-h-[150px] w-full resize-none border-0 bg-transparent px-3 py-3 text-sm text-[#1c293b] outline-none placeholder:text-[#828ea1]"
            />
            <div className="flex flex-wrap items-center gap-0.5 border-t border-[#E8EAEB] px-2 py-1.5">
              {[
                Bold,
                Italic,
                Underline,
                Palette,
                Link2,
                Image,
                Film,
                Paperclip,
              ].map((Icon, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled
                  className="inline-flex h-7 w-7 cursor-not-allowed items-center justify-center rounded text-[#A0A8B3]"
                >
                  <Icon size={15} strokeWidth={1.75} />
                </button>
              ))}
            </div>
          </div>
        </div>
      );

    case "borderedIconButton":
      if (messageShortcutsContext && item.label === "Add Shortcut") {
        return (
          <div key={key} className={cn("w-full", inGrid && "col-span-2")}>
            <button
              type="button"
              disabled={!messageShortcutsContext.canCreate}
              onClick={() => void messageShortcutsContext.createShortcut()}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded border px-3 text-[13px] font-bold",
                messageShortcutsContext.canCreate
                  ? "border-[#1972F5] bg-white text-[#1972F5]"
                  : "cursor-not-allowed border-[#1972F5]/40 bg-white text-[#1972F5]/40",
              )}
            >
              <Plus size={14} strokeWidth={2.5} />
              {item.label}
            </button>
          </div>
        );
      }

      return (
        <div key={key} className={cn("w-full", inGrid && "col-span-2")}>
          <button
            type="button"
            disabled={item.disabled}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded border px-3 text-[13px] font-bold",
              item.disabled
                ? item.buttonTone === "green"
                  ? "cursor-not-allowed border-[#40B630]/40 bg-white text-[#40B630]/40"
                  : "cursor-not-allowed border-[#1972F5]/40 bg-white text-[#1972F5]/40"
                : item.buttonTone === "blue"
                  ? "border-[#1972F5] bg-white text-[#1972F5]"
                  : item.buttonTone === "green"
                    ? "border-[#40B630] bg-white text-[#40B630]"
                    : "border-[#E6EAF0] bg-white text-[#1c293b]",
            )}
          >
            {item.icon === "plus-left" && <Plus size={14} strokeWidth={2.5} />}
            {item.label}
          </button>
        </div>
      );

    case "suffixField": {
      const emailDomainFieldKey = emailDomainFieldKeyForLabel(item.label);
      if (emailDomainContext && emailDomainFieldKey) {
        return (
          <EmailDomainField
            key={key}
            label={item.label}
            fieldKey={emailDomainFieldKey}
            value={emailDomainContext.fields[emailDomainFieldKey]}
            placeholder={item.placeholder}
            required={item.required}
            suffix={item.suffix}
            saving={emailDomainContext.saving === emailDomainFieldKey}
            onSave={emailDomainContext.updateField}
          />
        );
      }

      return (
        <div key={key} className={cn("w-full", inGrid && "col-span-2")}>
          <label className="mb-1.5 block text-sm font-bold text-[#606976]">
            {item.label}
            {item.required && <span className="text-[#606976]"> *</span>}
          </label>
          <div className="flex h-10 items-center overflow-hidden rounded border border-[#E8EAEB] bg-[#F8F9F9]">
            <input
              readOnly
              defaultValue={item.value}
              placeholder={item.placeholder}
              className={cn(
                "h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-[#1c293b] outline-none placeholder:font-normal placeholder:text-[#828ea1]",
                item.value ? "font-bold" : "font-normal",
              )}
            />
            <span className="shrink-0 px-3 text-sm font-bold text-[#606976]">{item.suffix}</span>
          </div>
        </div>
      );
    }

    case "inlineInfoStatus":
      return (
        <div
          key={key}
          className={cn(
            "flex items-start gap-2 rounded border border-[#C5E4F7] bg-[#F3FAFE] px-4 py-3 text-sm text-[#2c405a]",
            inGrid && "col-span-2",
          )}
        >
          <CircleCheck size={16} className="mt-0.5 shrink-0 text-[#0093ee]" strokeWidth={2} />
          <span className="font-medium leading-relaxed">{item.text}</span>
        </div>
      );

    case "spreadActionRow":
      return (
        <div
          key={key}
          className={cn("flex items-center justify-between gap-4", inGrid && "col-span-2")}
        >
          <p className="text-sm font-bold italic text-[#40B630]">
            {emailDomainContext?.fields.domainVerified === "true"
              ? "Custom domain verified for this workspace."
              : item.statusText}
          </p>
          <button
            type="button"
            disabled={
              item.disabled ||
              !emailDomainContext ||
              !emailDomainContext.fields.customDomain.trim() ||
              emailDomainContext.fields.domainVerified === "true" ||
              emailDomainContext.saving === "domainVerified"
            }
            onClick={() => void emailDomainContext?.verifyCustomDomain()}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded border px-3 text-[13px] font-bold disabled:opacity-50",
              item.disabled
                ? "cursor-not-allowed border-[#40B630]/40 bg-white text-[#40B630]/40"
                : item.buttonTone === "green"
                  ? "border-[#40B630] bg-white text-[#40B630]"
                  : "border-[#E6EAF0] bg-white text-[#1c293b]",
            )}
          >
            {item.buttonIcon === "check-left" && (
              <CircleCheck size={14} strokeWidth={2.5} />
            )}
            {emailDomainContext?.saving === "domainVerified"
              ? "Verifying…"
              : emailDomainContext?.fields.domainVerified === "true"
                ? "Verified"
                : item.button}
          </button>
        </div>
      );

    case "emailConnectionTest": {
      const result = emailDeliveryContext?.testResult;
      const renderStatus = (label: string, status?: { ok: boolean; error?: string }) => {
        if (!status) return null;
        return (
          <p
            key={label}
            className={cn(
              "text-sm font-medium",
              status.ok ? "text-[#40B630]" : "text-[#D14343]",
            )}
          >
            {label}: {status.ok ? "Connected" : status.error || "Failed"}
          </p>
        );
      };

      return (
        <div key={key} className={cn("flex flex-col gap-2", inGrid && "col-span-2")}>
          <button
            type="button"
            disabled={!emailDeliveryContext || emailDeliveryContext.testing}
            onClick={() => emailDeliveryContext?.testConnection()}
            className="inline-flex h-9 w-fit items-center gap-1.5 rounded border border-[#E6EAF0] bg-white px-3 text-[13px] font-bold text-[#1c293b] disabled:opacity-50"
          >
            {emailDeliveryContext?.testing ? "Testing…" : item.button}
          </button>
          {result && (
            <div className="flex flex-col gap-1">
              {renderStatus("IMAP", result.imap)}
              {renderStatus("SMTP", result.smtp)}
            </div>
          )}
        </div>
      );
    }

    case "infoStatusBlock":
      return (
        <div
          key={key}
          className={cn(
            "rounded border border-[#C5E4F7] bg-[#F3FAFE] px-4 py-4",
            inGrid && "col-span-2",
          )}
        >
          <div className="flex items-start gap-2 text-sm font-medium text-[#2c405a]">
            <CircleHelp size={16} className="mt-0.5 shrink-0 text-[#0093ee]" strokeWidth={2} />
            <span className="text-[#1c293b]">{item.title}</span>
          </div>
          <div className="mt-3 space-y-2.5 pl-6 text-sm leading-relaxed text-[#2c405a]">
            {item.paragraphs.map((paragraph, pi) => (
              <p key={pi} className={cn(paragraph.bold && "font-bold")}>
                {paragraph.text}
              </p>
            ))}
          </div>
        </div>
      );

    case "emailIpStatusPanel":
      return (
        <div
          key={key}
          className={cn("overflow-hidden rounded border border-[#E8EAEB]", inGrid && "col-span-2")}
        >
          <div className="flex items-center gap-2 border-b border-[#E8EAEB] bg-[#FAFBFC] px-4 py-3">
            <Lightbulb size={20} className="shrink-0 text-[#bbbfc4]" strokeWidth={1.75} />
            <span className="min-w-0 truncate text-sm font-medium text-[#1c293b]">
              {item.subgroupTitle}
            </span>
            <span className="inline-flex shrink-0 items-center rounded bg-[#40B630] px-1.5 py-0.5 text-xs font-semibold capitalize text-white">
              {item.reputationBadge}
            </span>
          </div>
          <div className="space-y-4 bg-white px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-[#1c293b]">{item.activeText}</p>
              <button
                type="button"
                disabled={
                  !item.pluginId ||
                  emailDeliveryContext?.installingPluginId === item.pluginId
                }
                onClick={() => {
                  if (item.pluginId) {
                    void emailDeliveryContext?.installPlugin(item.pluginId);
                  }
                }}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded border border-black/10 bg-white px-3 text-[13px] font-bold text-[#1c293b] disabled:opacity-60"
              >
                <Plus size={14} strokeWidth={2.5} />
                {emailDeliveryContext?.installingPluginId === item.pluginId
                  ? "Installing…"
                  : item.installButton}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded bg-[#40B630] px-2 py-1 text-sm font-semibold capitalize text-white">
                {item.poolBadge}
              </span>
              <span className="text-sm font-medium text-[#1c293b]">{item.poolText}</span>
              <a
                href={item.whyHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-[#0093ee] hover:underline"
              >
                {item.whyLabel}
              </a>
            </div>
          </div>
        </div>
      );

    case "messageShortcutsManage":
      if (messageShortcutsContext) {
        return (
          <MessageShortcutsManage
            key={key}
            title={item.title}
            subheading={item.subheading}
            searchPlaceholder={item.searchPlaceholder}
            emptyTitle={item.emptyTitle}
            emptyDescription={item.emptyDescription}
            groups={messageShortcutsContext.groups}
            query={messageShortcutsContext.searchQuery}
            saving={messageShortcutsContext.saving}
            onQueryChange={messageShortcutsContext.setSearchQuery}
            onDelete={messageShortcutsContext.deleteShortcut}
          />
        );
      }

      return (
        <div key={key} className={cn("w-full", inGrid && "col-span-2")}>
          <div className="mb-2 flex items-center justify-between gap-4">
            <h3 className="text-[18px] font-bold leading-7 text-[#1c293b]">{item.title}</h3>
            <div className="flex shrink-0 items-center gap-2">
              <div className="flex h-9 w-[180px] items-center rounded border border-[#E8EAEB] bg-[#F8F9F9] px-2">
                <Search size={18} className="mr-2 shrink-0 text-[#606976]" strokeWidth={1.75} />
                <input
                  type="text"
                  readOnly
                  placeholder={item.searchPlaceholder}
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#1c293b] outline-none placeholder:text-[#828ea1]"
                />
              </div>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#E8EAEB] bg-[#F4F4F5] text-[#606976]"
              >
                <ChevronsUpDown size={16} strokeWidth={1.75} />
              </button>
            </div>
          </div>
          <p className="mb-4 text-sm text-[#75869c]">{item.subheading}</p>
          <div className="rounded border border-[#E8EAEB] px-2.5 py-3.5 text-center">
            <p className="text-sm font-medium text-[#1c293b]">{item.emptyTitle}</p>
            <p className="mt-1 text-sm text-[#75869c]">{item.emptyDescription}</p>
          </div>
        </div>
      );

    case "trainingOption":
      if (workspaceDataContext && si === 0 && ii === 0) {
        return (
          <div
            key={key}
            className={cn(
              "flex items-start justify-between gap-6 border border-[#E3E8EF] bg-white px-[22px] py-4",
              item.join === "top" && "rounded-t-lg",
              item.join === "bottom" && "-mt-px rounded-b-lg",
              !item.join && "rounded-lg",
              inGrid && "col-span-2",
            )}
          >
            <div className="min-w-0 flex-1">
              <h6 className="text-[14.5px] font-semibold text-[#2c405a]">{item.title}</h6>
              <p className="mt-1.5 text-[13px] leading-[20px] text-[#75869c]">{item.description}</p>
              {workspaceDataContext.training.magicReplyNeverTrained && item.disclaimer && (
                <p className="mt-2 text-[13px] font-semibold text-[#FF5C0A]">{item.disclaimer}</p>
              )}
            </div>
            <button
              type="button"
              disabled={workspaceDataContext.saving}
              onClick={() => void workspaceDataContext.startMagicReplyTraining()}
              className={cn(
                "inline-flex h-[37px] shrink-0 items-center gap-1.5 rounded border px-3 text-xs font-bold disabled:opacity-60",
                item.buttonStyle === "solid"
                  ? "border-black/10 bg-[#FF5C0A] text-white"
                  : "border-[#FF5C0A] bg-white text-[#FF5C0A]",
              )}
            >
              {item.button}
              {item.buttonStyle === "solid" ? (
                <AlertTriangle size={14} strokeWidth={2} />
              ) : (
                <ChevronRight size={14} strokeWidth={2.5} />
              )}
            </button>
          </div>
        );
      }

      if (workspaceDataContext && si === 0 && ii === 1) {
        return (
          <div
            key={key}
            className={cn(
              "flex items-start justify-between gap-6 border border-[#E3E8EF] bg-white px-[22px] py-4",
              item.join === "top" && "rounded-t-lg",
              item.join === "bottom" && "-mt-px rounded-b-lg",
              !item.join && "rounded-lg",
              inGrid && "col-span-2",
            )}
          >
            <div className="min-w-0 flex-1">
              <h6 className="text-[14.5px] font-semibold text-[#2c405a]">{item.title}</h6>
              <p className="mt-1.5 text-[13px] leading-[20px] text-[#75869c]">
                {workspaceDataContext.training.knowledgeBaseDescription}
              </p>
            </div>
            <Link
              href={appHelpdeskPath("articles")}
              className={cn(
                "inline-flex h-[37px] shrink-0 items-center gap-1.5 rounded border px-3 text-xs font-bold",
                item.buttonStyle === "solid"
                  ? "border-black/10 bg-[#FF5C0A] text-white"
                  : "border-[#FF5C0A] bg-white text-[#FF5C0A]",
              )}
            >
              {item.button}
              {item.buttonStyle === "solid" ? (
                <AlertTriangle size={14} strokeWidth={2} />
              ) : (
                <ChevronRight size={14} strokeWidth={2.5} />
              )}
            </Link>
          </div>
        );
      }

      return (
        <div
          key={key}
          className={cn(
            "flex items-start justify-between gap-6 border border-[#E3E8EF] bg-white px-[22px] py-4",
            item.join === "top" && "rounded-t-lg",
            item.join === "bottom" && "-mt-px rounded-b-lg",
            !item.join && "rounded-lg",
            inGrid && "col-span-2",
          )}
        >
          <div className="min-w-0 flex-1">
            <h6 className="text-[14.5px] font-semibold text-[#2c405a]">{item.title}</h6>
            <p className="mt-1.5 text-[13px] leading-[20px] text-[#75869c]">{item.description}</p>
            {item.disclaimer && (
              <p className="mt-2 text-[13px] font-semibold text-[#FF5C0A]">{item.disclaimer}</p>
            )}
          </div>
          <button
            type="button"
            className={cn(
              "inline-flex h-[37px] shrink-0 items-center gap-1.5 rounded border px-3 text-xs font-bold",
              item.buttonStyle === "solid"
                ? "border-black/10 bg-[#FF5C0A] text-white"
                : "border-[#FF5C0A] bg-white text-[#FF5C0A]",
            )}
          >
            {item.button}
            {item.buttonStyle === "solid" ? (
              <AlertTriangle size={14} strokeWidth={2} />
            ) : (
              <ChevronRight size={14} strokeWidth={2.5} />
            )}
          </button>
        </div>
      );

    case "usageLimit": {
      const liveLimit = workspaceDataContext?.limitsByLabel[item.label];
      const main = liveLimit?.main ?? item.main;
      const secondary = liveLimit?.secondary ?? item.secondary;
      const progress = liveLimit?.progress ?? item.progress;
      const tone = liveLimit?.tone ?? item.tone;

      return (
        <div key={key} className={cn("w-full", inGrid && "col-span-2")}>
          <label className="mb-2 block text-sm font-bold text-[#606976]">{item.label}</label>
          <div className="flex items-end gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-baseline gap-1.5 text-sm font-semibold text-[#2c405a]">
                <span>{main}</span>
                {secondary && (
                  <span className="text-xs font-normal text-[#75869c]">{secondary}</span>
                )}
              </div>
              <div className="h-2 w-full overflow-hidden rounded bg-[#E8EAEB]">
                <div
                  className={cn(
                    "h-full rounded",
                    tone === "black" ? "bg-[#1c293b]" : "bg-[#1972F5]",
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <button
              type="button"
              disabled={workspaceDataContext?.saving}
              onClick={() => {
                if (liveLimit) {
                  void workspaceDataContext?.editLimit(liveLimit.key);
                }
              }}
              className="inline-flex h-[31px] shrink-0 items-center rounded border border-[#1972F5] bg-white px-3 text-xs font-bold text-[#1972F5] disabled:opacity-60"
            >
              {item.button}
            </button>
          </div>
        </div>
      );
    }

    case "contractAgreement":
      if (workspaceDataContext) {
        return (
          <div
            key={key}
            className={cn(
              "flex items-center justify-between gap-4",
              inGrid && "col-span-2",
            )}
          >
            <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[#2c405a]">
              <CircleCheck size={18} className="shrink-0 text-[#40B630]" strokeWidth={2.5} />
              <span className="truncate">{workspaceDataContext.contract.label}</span>
              {workspaceDataContext.contract.signed && (
                <span className="text-xs font-normal text-[#75869c]">Signed</span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                disabled={workspaceDataContext.saving || workspaceDataContext.contract.signed}
                onClick={() => void workspaceDataContext.signContract()}
                className="inline-flex h-[31px] items-center rounded border border-[#1c293b] bg-white px-3 text-xs font-bold text-[#1c293b] disabled:opacity-60"
              >
                {item.uploadButton}
              </button>
              <a
                href={workspaceDataContext.contract.viewHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-[31px] items-center rounded border border-[#1972F5] bg-white px-3 text-xs font-bold text-[#1972F5]"
              >
                {item.viewButton}
              </a>
            </div>
          </div>
        );
      }

      return (
        <div
          key={key}
          className={cn(
            "flex items-center justify-between gap-4",
            inGrid && "col-span-2",
          )}
        >
          <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[#2c405a]">
            <CircleCheck size={18} className="shrink-0 text-[#40B630]" strokeWidth={2.5} />
            <span className="truncate">{item.label}</span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href={appSettingsPath("workspace/data")}
              className="inline-flex h-[31px] items-center rounded border border-[#1c293b] bg-white px-3 text-xs font-bold text-[#1c293b]"
            >
              {item.uploadButton}
            </Link>
            <a
              href={item.viewHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-[31px] items-center rounded border border-[#1972F5] bg-white px-3 text-xs font-bold text-[#1972F5]"
            >
              {item.viewButton}
            </a>
          </div>
        </div>
      );

    case "dangerZoneAction": {
      const isDelete = item.variant === "delete";
      const canAct = workspaceDangerContext
        ? isDelete
          ? workspaceDangerContext.canDelete
          : workspaceDangerContext.canLeave
        : true;
      const blockedReason = workspaceDangerContext
        ? isDelete
          ? workspaceDangerContext.deleteBlockedReason
          : workspaceDangerContext.leaveBlockedReason
        : null;

      return (
        <div key={key} className={cn(inGrid && "col-span-2")}>
          <div className="mb-4">
            <h3
              className={cn(
                "text-lg font-bold leading-7",
                isDelete ? "text-[#E0102B]" : "text-[#1c293b]",
              )}
            >
              {item.title}
            </h3>
            <p
              className={cn(
                "mt-1 text-sm font-normal leading-[22px]",
                isDelete ? "text-[#E0102B]" : "text-[#1c293b]",
              )}
            >
              {item.description}
            </p>
            {workspaceDangerContext && blockedReason && (
              <p className="mt-2 text-sm font-normal text-[#75869c]">{blockedReason}</p>
            )}
          </div>
          <button
            type="button"
            disabled={workspaceDangerContext?.saving || !canAct}
            onClick={() => {
              if (!workspaceDangerContext) {
                return;
              }
              if (isDelete) {
                void workspaceDangerContext.deleteWorkspace();
              } else {
                void workspaceDangerContext.leaveWorkspace();
              }
            }}
            className={cn(
              "inline-flex h-[37px] items-center gap-2 rounded border border-black/10 px-3 text-xs font-bold text-white disabled:opacity-60",
              isDelete ? "bg-[#E93C0C]" : "bg-[#8d949d]",
            )}
          >
            {isDelete ? (
              <Trash2 size={14} strokeWidth={2} />
            ) : (
              <LogOut size={14} strokeWidth={2} />
            )}
            {item.button}
          </button>
        </div>
      );
    }

    case "danger":
      return (
        <div
          key={key}
          className="rounded-lg border border-[#F5C6C0] bg-[#FEF2F2] p-5"
        >
          <p className="text-sm font-bold text-[#1c293b]">{item.label}</p>
          <p className="mt-1 text-sm leading-relaxed text-[#5D6B98]">{item.description}</p>
          <button
            type="button"
            className="mt-4 rounded-lg bg-[#E11900] px-4 py-2 text-sm font-bold text-white"
          >
            {item.button}
          </button>
        </div>
      );

    case "toggle": {
      const on = toggles[key];
      const labelTone = item.labelTone ?? (item.shortcut ? "default" : "muted");
      const routingDependentDisabled =
        pageSlug === "inbox/routing" &&
        isRoutingRerunToggleKey(key) &&
        !toggles[ROUTING_ENABLE_RULES_TOGGLE_KEY];
      const searchAiOverlayDisabled =
        pageSlug === "chatbox/search-ai" &&
        isSearchAiToggleKey(key) &&
        !searchAiOverlayInstalled;
      const searchAiDirectDisabled =
        pageSlug === "chatbox/search-ai" &&
        isSearchAiDirectToggleKey(key) &&
        !toggles[SEARCH_AI_ENABLE_TOGGLE_KEY];
      const effectivelyDisabled =
        item.disabled ||
        routingDependentDisabled ||
        searchAiOverlayDisabled ||
        searchAiDirectDisabled;
      return (
        <div
          key={key}
          className={cn(
            "flex min-h-6 items-center justify-between gap-3.5",
            effectivelyDisabled && "opacity-60",
            inGrid && "col-span-2",
          )}
        >
          <p
            className={cn(
              "flex items-center text-sm font-bold leading-6",
              labelTone === "default" ? "text-[#1c293b]" : "text-[#8d949d]",
            )}
          >
            {item.label}
            {item.shortcut && <KeyboardShortcut keys={item.shortcut} />}
          </p>
          <button
            type="button"
            role="switch"
            aria-checked={on}
            disabled={effectivelyDisabled}
            onClick={() => {
              if (!effectivelyDisabled) {
                void setToggle(key, !on);
              }
            }}
            className={cn(
              "relative h-6 w-[42px] shrink-0 rounded-[20px] transition-colors",
              on ? "bg-[#1972F5]" : "bg-[#F4F4F5]",
              effectivelyDisabled && "cursor-not-allowed",
            )}
          >
            <span
              className={cn(
                "absolute top-1 h-4 w-4 rounded-full transition-all",
                on ? "left-[22px] bg-white" : "left-1 bg-[#bbbfc4]",
              )}
            />
          </button>
        </div>
      );
    }

    default:
      return null;
  }
}

function EntriesTable({
  item,
  inGrid,
  onCloseSession,
  closingSessionId,
  onDeleteRestriction,
  deletingRestriction,
}: {
  item: Extract<SectionItem, { kind: "entriesTable" }>;
  inGrid: boolean;
  onCloseSession?: (sessionId: string) => Promise<boolean>;
  closingSessionId?: string | null;
  onDeleteRestriction?: (id: string) => Promise<boolean>;
  deletingRestriction?: boolean;
}) {
  const isAudit = item.variant === "audit";
  const isRestrictions = item.variant === "restrictions";
  const headerIcons = isAudit
    ? ([Plus, UserRound, Clock, Cloud, null] as const)
    : isRestrictions
      ? ([Map, null] as const)
      : ([AppWindow, MapPin, null] as const);

  return (
    <div className={cn("w-full overflow-hidden", inGrid && "col-span-2")}>
      <div className="flex items-center text-sm font-semibold text-[#75869c]">
        {item.columns.map((column, idx) => {
          const Icon = headerIcons[idx];
          return (
            <div
              key={column.label || idx}
              className={cn(
                "flex min-w-0 items-center gap-1.5 px-2 py-2",
                column.align === "center" && "justify-center text-center",
              )}
              style={{ width: column.width }}
            >
              {Icon && <Icon size={16} className="shrink-0 text-[#75869c]" strokeWidth={1.75} />}
              <span className="truncate">{column.label}</span>
            </div>
          );
        })}
      </div>
      {item.rows.map((row, rowIdx) => (
        <div
          key={rowIdx}
          className="flex items-center border-t border-[#E6EAF0] text-sm font-medium text-[#2c405a]"
        >
          {row.map((cell, cellIdx) => (
            <div
              key={cellIdx}
              className={cn(
                "min-w-0 px-2",
                isAudit ? "py-2.5" : "truncate py-3",
                item.columns[cellIdx]?.align === "center" && "text-center",
              )}
              style={{ width: item.columns[cellIdx]?.width }}
            >
              <TableCell
                cell={cell}
                onCloseSession={onCloseSession}
                closingSessionId={closingSessionId}
                onDeleteRestriction={onDeleteRestriction}
                deletingRestriction={deletingRestriction}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function TableCell({
  cell,
  onCloseSession,
  closingSessionId,
  onDeleteRestriction,
  deletingRestriction,
}: {
  cell: TableRowCell;
  onCloseSession?: (sessionId: string) => Promise<boolean>;
  closingSessionId?: string | null;
  onDeleteRestriction?: (id: string) => Promise<boolean>;
  deletingRestriction?: boolean;
}) {
  switch (cell.kind) {
    case "text":
      return <span className="font-medium">{cell.value}</span>;
    case "location":
      return (
        <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
          <span className="text-base leading-none">🇵🇰</span>
          <span>{cell.country}</span>
          <span className="truncate font-normal text-[#75869c]">({cell.ip})</span>
        </span>
      );
    case "dateFrom":
      return (
        <span className="inline-flex min-w-0 items-center gap-1 truncate">
          <span className="font-medium">{cell.when}</span>
          <span className="truncate font-normal text-[#75869c]">
            from {cell.agent}
          </span>
        </span>
      );
    case "badge":
      return (
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-1 text-[11.5px] font-semibold capitalize",
            cell.tone === "green"
              ? "bg-[#EDFDF5] text-[#17B061]"
              : "bg-[#F4F4F5] text-[#75869c]",
          )}
        >
          {cell.value}
        </span>
      );
    case "action":
      return (
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#333e4f] disabled:opacity-60"
          disabled={!cell.sessionId || closingSessionId === cell.sessionId}
          onClick={() => {
            if (cell.sessionId) void onCloseSession?.(cell.sessionId);
          }}
        >
          <X size={14} className="text-[#75869c]" />
          {cell.label}
        </button>
      );
    case "deleteIcon":
      return (
        <button
          type="button"
          aria-label="Delete"
          disabled={!cell.id || deletingRestriction}
          onClick={() => {
            if (cell.id) void onDeleteRestriction?.(cell.id);
          }}
          className="inline-flex h-7 w-7 items-center justify-center rounded border border-[#E6EAF0] bg-transparent text-[#75869c] disabled:opacity-60"
        >
          <X size={14} strokeWidth={2} />
        </button>
      );
    case "auditAction":
      return (
        <span className="inline-flex min-w-0 items-center gap-2 truncate font-semibold text-[#2c405a]">
          <span className="truncate">{cell.action}</span>
          {cell.badge && (
            <span className="inline-flex shrink-0 rounded bg-[#F97316] px-1.5 py-0.5 text-[10px] font-semibold lowercase text-white">
              {cell.badge}
            </span>
          )}
        </span>
      );
    case "operatorCell":
      return (
        <span className="inline-flex min-w-0 items-center gap-2 truncate font-semibold text-[#2c405a]">
          {cell.avatarUrl ? (
            <img
              src={cell.avatarUrl}
              alt=""
              className="h-5 w-5 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E8EAEB]">
              <UserRound size={12} className="text-[#75869c]" />
            </span>
          )}
          <span className="truncate">{cell.name}</span>
        </span>
      );
    case "timeAgo":
      return <span className="truncate font-normal text-[#2c405a]">{cell.value}</span>;
    case "auditIp":
      return (
        <span className="inline-flex min-w-0 items-center gap-1.5 truncate font-normal text-[#2c405a]">
          <span className="text-base leading-none">🇵🇰</span>
          <span className="truncate">{cell.ip}</span>
        </span>
      );
    case "spacer":
      return null;
    default:
      return null;
  }
}

function CopyField({
  item,
  inGrid,
  valueOverride,
}: {
  item: Extract<SectionItem, { kind: "copyField" }>;
  inGrid: boolean;
  valueOverride?: string;
}) {
  const [copied, setCopied] = useState(false);
  const displayValue = valueOverride ?? item.value;

  const copy = async () => {
    if (!displayValue) {
      return;
    }
    await navigator.clipboard.writeText(displayValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (item.variant === "horizontal") {
    return (
      <div className={cn("mb-6 flex items-center gap-6", inGrid && "col-span-2")}>
        <label className="w-[140px] shrink-0 text-sm font-bold text-[#606976]">
          {item.label}
        </label>
        <div className="flex min-w-0 flex-1 items-center gap-6">
          <div className="flex h-10 min-w-0 flex-1 items-center rounded border border-[#E8EAEB] bg-white">
            <input
              readOnly
              value={displayValue}
              className="h-full w-full bg-transparent px-3 text-sm font-semibold text-[#777f89] outline-none"
            />
          </div>
          <button
            type="button"
            onClick={copy}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded border border-black/10 bg-[#1c293b] px-3 text-[13px] font-bold text-white"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            Copy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(inGrid && "col-span-2")}>
      <label className="mb-1.5 block text-sm font-semibold text-[#2c405a]">
        {item.label}
      </label>
      <div className={cn("flex gap-2", item.multiline ? "items-start" : "items-center")}>
        {item.multiline ? (
          <textarea
            readOnly
            rows={5}
            value={displayValue}
            className="min-h-[120px] min-w-0 flex-1 resize-y rounded-lg border border-[#E8EAEB] bg-[#F8F9F9] px-3 py-2 font-mono text-xs leading-relaxed text-[#2c405a] outline-none"
          />
        ) : (
          <input
            readOnly
            value={displayValue}
            className="h-10 min-w-0 flex-1 rounded-lg border border-[#E8EAEB] bg-[#F8F9F9] px-3 font-mono text-xs text-[#2c405a] outline-none"
          />
        )}
        <button
          type="button"
          onClick={copy}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#E6EAF0] bg-white px-3 text-sm font-semibold text-[#2c405a]",
            item.multiline ? "h-10" : "h-10",
          )}
        >
          {copied ? <Check size={14} className="text-[#40B630]" /> : <Copy size={14} />}
          Copy
        </button>
      </div>
      {item.help && (
        <p className="mt-1.5 text-xs leading-relaxed text-[#828ea1]">{item.help}</p>
      )}
    </div>
  );
}

function ShopifyIntegrationPanel({
  shopify,
  onRefresh,
}: {
  shopify: NonNullable<
    import("@/types/workspace-integrations").WorkspaceIntegrationsPayload["shopify"]
  >;
  onRefresh?: () => Promise<import("@/types/workspace-integrations").WorkspaceIntegrationsPayload>;
}) {
  const { sync, syncing, message } = useShopifyContactSync();
  const lastSyncLabel = shopify.lastContactSyncAt
    ? new Date(shopify.lastContactSyncAt).toLocaleString()
    : null;

  return (
    <div className="col-span-2 mb-6 rounded-lg border border-[#E8EAEB] bg-[#F8FBF8] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-bold text-[#1c293b]">Shopify</h4>
          {shopify.linked ? (
            <p className="mt-1 text-sm text-[#5D6B98]">
              Connected to <span className="font-semibold text-[#2C405A]">{shopify.shop}</span>
              {shopify.widgetEnabled === false ? " · storefront widget disabled" : ""}
            </p>
          ) : (
            <p className="mt-1 text-sm text-[#5D6B98]">
              Install the Bybelt Chat app on your Shopify store to sync customers and order context.
            </p>
          )}
          {lastSyncLabel ? (
            <p className="mt-1 text-xs text-[#828EA1]">
              Last contact sync: {lastSyncLabel}
              {shopify.lastContactSyncTotal != null
                ? ` · ${shopify.lastContactSyncTotal} customers`
                : ""}
            </p>
          ) : null}
          {message ? <p className="mt-2 text-sm text-[#5D6B98]">{message}</p> : null}
          {shopify.linked ? (
            <p className="mt-1 text-xs text-[#828EA1]">
              Webhooks: orders, customers, refunds, fulfillments, and GDPR compliance events
              {shopify.webhookTopicCount != null
                ? ` · ${shopify.webhookTopicCount} Shopify topics registered`
                : ""}
              .
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {shopify.linked ? (
            <button
              type="button"
              disabled={syncing}
              onClick={() => {
                void sync().then((ok) => {
                  if (ok) void onRefresh?.();
                });
              }}
              className="inline-flex h-9 items-center rounded border border-[#39A746] bg-white px-3 text-xs font-bold text-[#39A746] disabled:opacity-60"
            >
              {syncing ? "Syncing…" : "Sync customers"}
            </button>
          ) : null}
          {shopify.linked && shopify.shopAdminUrl ? (
            <a
              href={shopify.shopAdminUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center rounded border border-[#E8EAEB] bg-white px-3 text-xs font-bold text-[#5D6B98] hover:bg-[#F8F9F9]"
            >
              Open Shopify admin
            </a>
          ) : null}
          {shopify.linked ? (
            <Link
              href="/?inbox=shopify"
              className="inline-flex h-9 items-center rounded border border-[#5DAC5D] bg-[#F2F8F2] px-3 text-xs font-bold text-[#5DAC5D] hover:bg-[#E8F4E8]"
            >
              Open Shopify inbox
            </Link>
          ) : null}
          <a
            href={shopify.installUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center rounded border border-[#1c293b] bg-[#1c293b] px-3 text-xs font-bold text-white hover:bg-[#2c405a]"
          >
            {shopify.linked ? "Open Shopify app" : "Connect Shopify"}
          </a>
        </div>
      </div>
    </div>
  );
}

function IntegrationCatalog({
  item,
  inGrid,
  onChannelClick,
  onFooterClick,
}: {
  item: Extract<SectionItem, { kind: "integrationCatalog" }>;
  inGrid: boolean;
  onChannelClick?: (channel: { name: string; image: string }) => void;
  onFooterClick?: () => void;
}) {
  return (
    <div className={cn(inGrid && "col-span-2")}>
      <p className="mb-6 text-sm leading-[22px] text-[#75869c]">{item.intro}</p>
      {(item.categories ?? []).map((category) => (
        <div key={category.title} className="mb-8 flex flex-col gap-4 last:mb-0">
          <h4 className="text-base font-bold text-[#1c293b]">{category.title}</h4>
          <div className="grid grid-cols-3 gap-4">
            {category.channels.map((channel) => (
              <button
                key={channel.name}
                type="button"
                onClick={() => onChannelClick?.(channel)}
                className="flex h-[55px] items-center gap-4 rounded-lg border border-[#E8EAEB] bg-white px-4 py-2.5 text-left hover:bg-[#F8F9FB]"
              >
                <img
                  src={channel.image}
                  alt=""
                  className="h-[34px] w-[34px] shrink-0 object-contain"
                />
                <span className="truncate text-base font-medium text-[#1c293b]">
                  {channel.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={onFooterClick}
        className="mt-2 inline-flex h-10 items-center rounded border border-black/10 bg-[#1c293b] px-3 text-[13px] font-bold text-white hover:bg-[#2c405a]"
      >
        {item.footerButton}
      </button>
    </div>
  );
}
