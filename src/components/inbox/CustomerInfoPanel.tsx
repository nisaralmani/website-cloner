"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  ArrowLeftRight,
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  Globe,
  MapPin,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CountryFlag, PersonGlyph } from "@/components/icons";
import type { Conversation, CustomerDetails, VisitorDataEntry } from "@/types/inbox";
import type { ShopifyOrderSummary } from "@/types/shopify";
import { useShopifyCustomerContext } from "@/hooks/useShopifyCustomerContext";

function formatShopifyOrderDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ShopifyOrderStatusBadge({ label }: { label: string }) {
  return (
    <span className="rounded bg-[#eef2f7] px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#5c6b7f]">
      {label}
    </span>
  );
}

function ShopifyOrderRow({ order }: { order: ShopifyOrderSummary }) {
  const processedAt = formatShopifyOrderDate(order.processedAt);

  return (
    <li className="rounded border border-[#E6EAF0] px-2.5 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={order.adminUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold text-[#0093ee] hover:underline"
        >
          {order.name}
        </a>
        {order.financialStatus ? (
          <ShopifyOrderStatusBadge label={order.financialStatus} />
        ) : null}
        {order.fulfillmentStatus ? (
          <ShopifyOrderStatusBadge label={order.fulfillmentStatus} />
        ) : null}
      </div>
      <p className="mt-1 text-sm text-[#828ea1]">
        {order.total ? `${order.total.amount} ${order.total.currencyCode}` : "—"}
        {processedAt ? ` · ${processedAt}` : ""}
      </p>
      {order.lineItems.length > 0 ? (
        <ul className="mt-1.5 list-inside list-disc text-xs text-[#5c6b7f]">
          {order.lineItems.map((item, index) => (
            <li key={`${item.title}-${index}`}>
              {item.quantity > 1 ? `${item.quantity}× ` : ""}
              {item.title}
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function Section({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div>
      <div className="flex h-11 items-center justify-between border-y border-[#E6EAF0] px-4">
        <span className="text-sm font-semibold text-[#2c405a]">{label}</span>
        <ChevronDown size={16} className="text-[#828ea1]" />
      </div>
      <div className="flex flex-col gap-1.5 px-4 py-2">{children}</div>
    </div>
  );
}

function Row({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 py-1 text-sm text-[#2c405a]">
      <Icon size={16} className="shrink-0 text-[#828ea1]" />
      <span>{children}</span>
    </div>
  );
}

function CustomerEmailField({
  email,
  saving,
  onSave,
}: {
  email: string | null;
  saving?: boolean;
  onSave?: (email: string | null) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const beginEditing = () => {
    setDraft(email ?? "");
    setEditing(true);
  };

  if (editing) {
    return (
      <form
        className="flex w-full flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!onSave || saving) return;
          void (async () => {
            const saved = await onSave(draft.trim() ? draft.trim() : null);
            if (saved) setEditing(false);
          })();
        }}
      >
        <input
          type="email"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="customer@example.com"
          disabled={saving}
          className="w-full rounded-md border border-[#E6EAF0] px-3 py-2 text-sm text-[#2c405a] outline-none focus:border-[#1972F5]"
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="text-sm font-semibold text-[#0093ee] disabled:opacity-60"
          >
            Save
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => {
          setEditing(false);
        }}
            className="text-sm text-[#828ea1] disabled:opacity-60"
          >
            Cancel
          </button>
          {email && (
            <button
              type="button"
              disabled={saving}
              onClick={() => void onSave?.(null).then((saved) => saved && setEditing(false))}
              className="ml-auto text-sm text-[#828ea1] disabled:opacity-60"
            >
              Remove
            </button>
          )}
        </div>
      </form>
    );
  }

  if (email) {
    return (
      <button
        type="button"
        onClick={beginEditing}
        className="text-left text-sm text-[#0093ee] hover:underline"
      >
        {email}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={beginEditing}
      className="text-sm text-[#0093ee] hover:underline"
    >
      set email
    </button>
  );
}

function ConversationSegmentTag({ segment }: { segment: string }) {
  return (
    <span className="inline-flex rounded-full bg-[#E8F0FE] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#1972F5]">
      {segment}
    </span>
  );
}

function ConversationSegmentsField({
  segments,
  saving,
  onAdd,
  onRemove,
}: {
  segments: string[];
  saving?: boolean;
  onAdd?: (segment: string) => Promise<boolean>;
  onRemove?: (segment: string) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState("");

  return (
    <div className="flex flex-col gap-2">
      {segments.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {segments.map((segment) => (
            <div key={segment} className="inline-flex items-center gap-1">
              <ConversationSegmentTag segment={segment} />
              {onRemove && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void onRemove(segment)}
                  className="text-[11px] text-[#828ea1] hover:text-[#2c405a] disabled:opacity-60"
                  aria-label={`Remove ${segment} segment`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!onAdd || saving) return;
          void (async () => {
            const saved = await onAdd(draft.trim());
            if (saved) setDraft("");
          })();
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Segment conversation…"
          disabled={saving}
          className="w-full rounded-md border border-[#E6EAF0] px-3 py-2 text-sm text-[#2c405a] placeholder-[#828ea1] outline-none focus:border-[#1972F5] disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={saving || !draft.trim()}
          className="self-start text-sm font-semibold text-[#0093ee] disabled:opacity-60"
        >
          Add segment
        </button>
      </form>
    </div>
  );
}

function formatVisitorDataKey(key: string): string {
  const labels: Record<string, string> = {
    shopify_last_order: "Last Shopify order",
    shopify_location: "Shopify location",
    shopify_phone: "Shopify phone",
    shopify_customer_id: "Shopify customer ID",
    shopify_products: "Recent Shopify products",
    shopify_total_spent: "Shopify lifetime spent",
    shopify_order_count: "Shopify order count",
    shopify_tags: "Shopify customer tags",
    shopify_shop: "Shopify store",
    shopify_order_status: "Shopify order status",
    shopify_store_name: "Shopify store name",
  };
  return labels[key] ?? key;
}

function VisitorDataField({
  entries,
  saving,
  onSave,
  onRemove,
}: {
  entries: VisitorDataEntry[];
  saving?: boolean;
  onSave?: (key: string, value: string) => Promise<boolean>;
  onRemove?: (key: string) => Promise<boolean>;
}) {
  const [keyDraft, setKeyDraft] = useState("");
  const [valueDraft, setValueDraft] = useState("");

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry) => (
        <div
          key={entry.key}
          className="flex items-start justify-between gap-2 rounded-md border border-[#E6EAF0] px-3 py-2"
        >
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-[#828ea1]">
              {formatVisitorDataKey(entry.key)}
            </p>
            <p className="truncate text-sm text-[#2c405a]">{entry.value}</p>
          </div>
          {onRemove && (
            <button
              type="button"
              disabled={saving}
              onClick={() => void onRemove(entry.key)}
              className="shrink-0 text-xs text-[#828ea1] hover:text-[#2c405a] disabled:opacity-60"
            >
              Remove
            </button>
          )}
        </div>
      ))}

      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!onSave || saving) return;
          void (async () => {
            const saved = await onSave(keyDraft.trim(), valueDraft.trim());
            if (saved) {
              setKeyDraft("");
              setValueDraft("");
            }
          })();
        }}
      >
        <div className="flex gap-2">
          <input
            value={keyDraft}
            onChange={(event) => setKeyDraft(event.target.value)}
            placeholder="Data key…"
            disabled={saving}
            className="w-1/2 rounded-md border border-[#E6EAF0] px-3 py-2 text-sm text-[#2c405a] placeholder-[#828ea1] outline-none focus:border-[#1972F5] disabled:opacity-60"
          />
          <input
            value={valueDraft}
            onChange={(event) => setValueDraft(event.target.value)}
            placeholder="Data value…"
            disabled={saving}
            className="w-1/2 rounded-md border border-[#E6EAF0] px-3 py-2 text-sm text-[#2c405a] placeholder-[#828ea1] outline-none focus:border-[#1972F5] disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={saving || !keyDraft.trim() || !valueDraft.trim()}
          className="self-start text-sm font-semibold text-[#0093ee] disabled:opacity-60"
        >
          Save data
        </button>
      </form>
    </div>
  );
}

function SimulateVisitorMessageField({
  simulating,
  onSimulate,
}: {
  simulating?: boolean;
  onSimulate?: (text: string) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState("");

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!onSimulate || simulating) return;
        void (async () => {
          const sent = await onSimulate(draft);
          if (sent) setDraft("");
        })();
      }}
    >
      <textarea
        rows={3}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Simulate a visitor message…"
        disabled={simulating}
        className="w-full resize-none rounded-md border border-[#E6EAF0] px-3 py-2 text-sm text-[#2c405a] placeholder-[#828ea1] outline-none focus:border-[#1972F5] disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={simulating || !draft.trim()}
        className="self-start rounded-md bg-[#1972F5] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        Send as visitor
      </button>
    </form>
  );
}

function ShopifyCustomerSection({
  email,
  onAddSegment,
  savingSegments,
  segments,
}: {
  email: string | null;
  segments: string[];
  savingSegments?: boolean;
  onAddSegment?: (segment: string) => Promise<boolean>;
}) {
  const { data, loading, error } = useShopifyCustomerContext(email);

  if (!email?.trim()) {
    return <p className="text-sm text-[#828ea1]">Add a customer email to load Shopify data.</p>;
  }

  if (loading) {
    return <p className="text-sm text-[#828ea1]">Loading Shopify profile…</p>;
  }

  if (error) {
    return <p className="text-sm text-[#828ea1]">Shopify data is unavailable right now.</p>;
  }

  if (!data?.linked) {
    return (
      <p className="text-sm text-[#828ea1]">
        Connect Shopify in{" "}
        <Link href="/settings/workspace/integrations" className="font-semibold text-[#0093ee] hover:underline">
          Setup &amp; Integrations
        </Link>
        .
      </p>
    );
  }

  if (!data.customer) {
    return (
      <p className="text-sm text-[#828ea1]">
        No Shopify customer found for <span className="font-medium text-[#2c405a]">{email}</span>.
      </p>
    );
  }

  const customer = data.customer;
  const shopAdminUrl =
    "shopAdminUrl" in data && data.shopAdminUrl
      ? data.shopAdminUrl
      : null;
  const hasShopifySegment = segments.includes("shopify");

  return (
    <div className="flex flex-col gap-2">
      <a
        href={customer.adminUrl}
        target="_blank"
        rel="noreferrer"
        className="text-sm font-semibold text-[#0093ee] hover:underline"
      >
        {customer.displayName}
      </a>
      {shopAdminUrl ? (
        <a
          href={shopAdminUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-[#828ea1] hover:text-[#0093ee] hover:underline"
        >
          Open {data.shop} admin
        </a>
      ) : null}
      {customer.location ? (
        <p className="text-sm text-[#2c405a]">{customer.location}</p>
      ) : null}
      {customer.phone ? (
        <p className="text-sm text-[#2c405a]">{customer.phone}</p>
      ) : null}
      <p className="text-sm text-[#828ea1]">
        {customer.orderCount} order{customer.orderCount === 1 ? "" : "s"}
        {customer.totalSpent
          ? ` · ${customer.totalSpent.amount} ${customer.totalSpent.currencyCode} spent`
          : ""}
      </p>
      {customer.tags.length > 0 ? (
        <p className="text-sm text-[#2c405a]">Tags: {customer.tags.join(", ")}</p>
      ) : null}
      {customer.orders.length > 0 ? (
        <div className="mt-1 flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#828ea1]">
            Recent orders
          </p>
          <ul className="flex flex-col gap-1.5">
            {customer.orders.map((order) => (
              <ShopifyOrderRow key={order.id} order={order} />
            ))}
          </ul>
        </div>
      ) : null}
      {!hasShopifySegment ? (
        <p className="text-xs text-[#828ea1]">
          {onAddSegment
            ? "Shopify segment will be added automatically when a customer is matched."
            : "Matched Shopify customers are tagged with the shopify segment."}
        </p>
      ) : null}
    </div>
  );
}

export default function CustomerInfoPanel({
  conversation,
  details: detailsProp,
  savingEmail = false,
  savingVisitorData = false,
  savingSegments = false,
  simulatingVisitor = false,
  onSaveEmail,
  onSaveVisitorData,
  onRemoveVisitorData,
  onAddSegment,
  onRemoveSegment,
  onSimulateVisitorMessage,
}: {
  conversation: Conversation;
  details?: CustomerDetails | null;
  savingEmail?: boolean;
  savingVisitorData?: boolean;
  savingSegments?: boolean;
  simulatingVisitor?: boolean;
  onSaveEmail?: (email: string | null) => Promise<boolean>;
  onSaveVisitorData?: (key: string, value: string) => Promise<boolean>;
  onRemoveVisitorData?: (key: string) => Promise<boolean>;
  onAddSegment?: (segment: string) => Promise<boolean>;
  onRemoveSegment?: (segment: string) => Promise<boolean>;
  onSimulateVisitorMessage?: (text: string) => Promise<boolean>;
}) {
  const details = detailsProp ?? null;

  if (!details) {
    return (
      <div className="flex h-full w-[268px] shrink-0 flex-col overflow-y-auto border-l border-[#E6EAF0] bg-white">
        <div className="flex flex-col items-start gap-2 px-4 pb-4 pt-5">
          <div className="relative">
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br text-white",
                conversation.avatarGradient,
              )}
            >
              <PersonGlyph size={28} />
            </div>
            <span className="absolute bottom-0 right-0 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white ring-2 ring-white">
              <CountryFlag code={conversation.country} className="text-xs" />
            </span>
          </div>
          <span className="text-lg font-bold text-[#1c293b]">{conversation.name}</span>
          <span className="text-sm text-[#828ea1]">Conversation details are unavailable.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-[268px] shrink-0 flex-col overflow-y-auto border-l border-[#E6EAF0] bg-white">
      <div className="flex flex-col items-start gap-2 px-4 pb-4 pt-5">
        <div className="relative">
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br text-white",
              conversation.avatarGradient,
            )}
          >
            <PersonGlyph size={28} />
          </div>
          <span className="absolute bottom-0 right-0 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white ring-2 ring-white">
            <CountryFlag code={conversation.country} className="text-xs" />
          </span>
        </div>
        <span className="text-lg font-bold text-[#1c293b]">{conversation.name}</span>
        <CustomerEmailField email={details.email} saving={savingEmail} onSave={onSaveEmail} />
        <span className="text-sm text-[#828ea1]">{details.location}</span>
      </div>

      <Section label="Main information">
        <Row icon={MapPin}>{details.location}</Row>
        <Row icon={Clock}>{`${details.localTime} (${details.timezone})`}</Row>
        <Row icon={Globe}>
          <CountryFlag code={details.countryFlag} className="text-base" />
        </Row>
        <Row icon={ArrowLeftRight}>{details.channel}</Row>
      </Section>

      <Section label="Visitor device">
        <Row icon={Compass}>{details.device}</Row>
        <Row icon={Wifi}>{details.ip}</Row>
      </Section>

      <Section label="Quick jump" />

      <div className="flex h-11 items-center justify-between border-b border-[#E6EAF0] px-4">
        <span className="text-sm font-semibold text-[#2c405a]">Shared image files</span>
        <ChevronRight size={16} className="text-[#828ea1]" />
      </div>

      <Section label="Segments for conversation">
        <ConversationSegmentsField
          segments={details.segments ?? []}
          saving={savingSegments}
          onAdd={onAddSegment}
          onRemove={onRemoveSegment}
        />
      </Section>

      <Section label="Visitor data">
        <VisitorDataField
          entries={details.visitorData ?? []}
          saving={savingVisitorData}
          onSave={onSaveVisitorData}
          onRemove={onRemoveVisitorData}
        />
      </Section>

      <Section label="Simulate visitor">
        <SimulateVisitorMessageField
          simulating={simulatingVisitor}
          onSimulate={onSimulateVisitorMessage}
        />
      </Section>

      <Section label="Shopify">
        <ShopifyCustomerSection
          email={details.email}
          segments={details.segments ?? []}
          savingSegments={savingSegments}
          onAddSegment={onAddSegment}
        />
      </Section>
    </div>
  );
}
