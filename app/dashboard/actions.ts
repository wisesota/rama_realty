"use server";

import { refresh, revalidatePath } from "next/cache";
import { requireStaffContext } from "@/lib/dashboard/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  type ActionState,
  canTransitionPublication,
  isAllowedPropertyImageUrl,
  readInteger,
  readText,
  slugify,
} from "@/lib/dashboard/validation";

const inventoryWriteRoles = ["owner", "admin", "inventory_manager"] as const;
const catalogWorkflowRoles = ["owner", "admin", "inventory_manager", "editor"] as const;
const publicationRoles = ["owner", "admin", "editor"] as const;
const advisorRoles = ["owner", "admin", "agent"] as const;

export async function transitionInquiryAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { staff } = await requireStaffContext(advisorRoles);
  const inquiryId = readText(formData, "inquiryId", 64);
  const status = readText(formData, "status", 40);
  if (!/^[0-9a-f-]{36}$/i.test(inquiryId) || !["new", "qualified", "contacted", "viewing_booked", "closed", "spam"].includes(status)) {
    return { status: "error", message: "Choose a valid conversation status." };
  }
  const { error } = await createAdminClient().rpc("transition_inquiry_service", { p_actor_id: staff.userId, p_inquiry_id: inquiryId, p_status: status });
  if (error) {
    console.error("Inquiry transition failed:", error.code);
    return { status: "error", message: "The conversation status could not be updated." };
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/inquiries");
  refresh();
  return { status: "success", message: `Conversation moved to ${status.replace("_", " ")}.` };
}

export async function createAdvisorFeedbackAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, staff } = await requireStaffContext(advisorRoles);
  const inquiryId = readText(formData, "inquiryId", 64);
  const category = readText(formData, "category", 40);
  const outcome = readText(formData, "outcome", 40);
  const notes = readText(formData, "notes", 1000);
  if (!/^[0-9a-f-]{36}$/i.test(inquiryId)
    || !["missing_evidence", "wrong_criterion", "stale_source", "handoff_outcome"].includes(category)
    || (outcome && !["useful", "needs_follow_up", "not_a_fit", "contacted", "viewing_booked", "closed"].includes(outcome))) {
    return { status: "error", message: "Choose a valid evidence issue and outcome." };
  }
  const { error } = await supabase.rpc("create_advisor_evidence_feedback", {
    p_actor_id: staff.userId,
    p_inquiry_id: inquiryId,
    p_category: category,
    p_outcome: outcome,
    p_notes: notes,
  });
  if (error) return { status: "error", message: "Advisor feedback could not be saved." };
  return { status: "success", message: "Feedback saved for the evidence-quality review." };
}

export async function createPropertyAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, staff } = await requireStaffContext(inventoryWriteRoles);
  const name = readText(formData, "name", 160);
  const location = readText(formData, "location", 160);
  const description = readText(formData, "description", 1800);
  const feature = readText(formData, "feature", 240);
  const imageUrl = readText(formData, "imageUrl", 1000);
  const imageAlt = readText(formData, "imageAlt", 300);
  const sourceName = readText(formData, "sourceName", 160);
  const propertyType = readText(formData, "propertyType", 40);
  const priceAed = readInteger(formData, "priceAed");
  const beds = readInteger(formData, "beds");
  const baths = readInteger(formData, "baths");
  const areaSqFt = readInteger(formData, "areaSqFt");
  const slug = slugify(name);

  const fieldErrors: Record<string, string> = {};
  if (name.length < 2) fieldErrors.name = "Name is required.";
  if (location.length < 2) fieldErrors.location = "Location is required.";
  if (description.length < 40) fieldErrors.description = "Add at least 40 characters of factual description.";
  if (feature.length < 2) fieldErrors.feature = "Add a concise evidence-led feature.";
  if (!priceAed || priceAed <= 0) fieldErrors.priceAed = "Enter a valid AED price.";
  if (beds === null || beds < 0 || beds > 30) fieldErrors.beds = "Enter a valid bedroom count.";
  if (baths === null || baths < 0 || baths > 30) fieldErrors.baths = "Enter a valid bathroom count.";
  if (!areaSqFt || areaSqFt <= 0) fieldErrors.areaSqFt = "Enter a valid area.";
  if (!isAllowedPropertyImageUrl(imageUrl)) fieldErrors.imageUrl = "Use an approved Unsplash or Rama Storage image URL.";
  if (imageAlt.length < 2) fieldErrors.imageAlt = "Describe the image.";
  if (sourceName.length < 2) fieldErrors.sourceName = "Name the inventory source.";
  if (!slug) fieldErrors.name = "Name must contain letters or numbers.";

  if (Object.keys(fieldErrors).length) {
    return { status: "error", message: "Review the highlighted catalog fields.", fieldErrors };
  }

  const propertyId = `${slug}-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  const { error } = await supabase.from("properties").insert({
    id: propertyId,
    organization_id: staff.organizationId,
    slug,
    name,
    location,
    description,
    price_aed: priceAed!,
    beds: beds!,
    baths: baths!,
    area_sq_ft: areaSqFt!,
    feature,
    match_reason: "Candidate reasons are generated from each buyer’s current brief.",
    image_url: imageUrl,
    image_alt: imageAlt,
    status: "live",
    property_type: propertyType || "apartment",
    completion_status: "ready",
    availability_status: "available",
    publication_status: "draft",
    source_name: sourceName,
    source_updated_at: now,
    created_by: staff.userId,
    updated_by: staff.userId,
  });

  if (error) {
    return { status: "error", message: "The draft could not be saved. Check for duplicate catalog data." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/inventory");
  refresh();
  return { status: "success", message: `${name} is saved as a governed draft.` };
}

export async function changePublicationAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, staff } = await requireStaffContext();
  const propertyId = readText(formData, "propertyId", 200);
  const target = readText(formData, "target", 30);
  if (!propertyId || !["draft", "in_review", "published", "archived"].includes(target)) {
    return { status: "error", message: "Invalid publication request." };
  }

  const { data: property, error: readError } = await supabase
    .from("properties")
    .select("id, name, organization_id, publication_status, status, availability_status, source_name, source_updated_at, description, slug, image_url, image_alt, version")
    .eq("id", propertyId)
    .eq("organization_id", staff.organizationId)
    .maybeSingle();
  if (readError || !property) return { status: "error", message: "Property was not found in this workspace." };
  if (!canTransitionPublication(property.publication_status, target)) {
    return { status: "error", message: `A ${property.publication_status.replace("_", " ")} record cannot move directly to ${target.replace("_", " ")}.` };
  }
  const allowedRoles = target === "published" || target === "archived" ? publicationRoles : catalogWorkflowRoles;
  if (!allowedRoles.includes(staff.role as never)) {
    return { status: "error", message: "Your workspace role cannot make this publication transition." };
  }

  if (target === "published") {
    const sourceAge = property.source_updated_at ? Date.now() - new Date(property.source_updated_at).getTime() : Number.POSITIVE_INFINITY;
    const isFresh = Number.isFinite(sourceAge) && sourceAge <= 30 * 24 * 60 * 60 * 1000;
    if (
      property.status !== "live" ||
      property.availability_status !== "available" ||
      !property.source_name ||
      !isFresh ||
      !property.description ||
      !property.slug ||
      !isAllowedPropertyImageUrl(property.image_url) ||
      property.image_alt.trim().length < 2
    ) {
      return {
        status: "error",
        message: "Publishing requires live availability, a source refreshed within 30 days, description, slug, and valid image.",
      };
    }
  }

  const nextState = {
    publication_status: target,
    published_at: target === "published" ? new Date().toISOString() : property.publication_status === "published" ? null : undefined,
    updated_by: staff.userId,
    version: property.version + 1,
  };
  const { data: updated, error } = await supabase
    .from("properties")
    .update(nextState)
    .eq("id", propertyId)
    .eq("organization_id", staff.organizationId)
    .eq("version", property.version)
    .select("id")
    .maybeSingle();
  if (error) return { status: "error", message: "Publication state could not be changed." };
  if (!updated) return { status: "error", message: "This record changed while you were reviewing it. Refresh and try again." };

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/inventory");
  refresh();
  return { status: "success", message: `${property.name} is now ${target.replace("_", " ")}.` };
}
