import "dotenv/config";
import { supabaseAdmin } from "../src/supabase.js";

async function run() {
  console.log("Mendaftarkan akun Super User & Medium User via Supabase API...");

  // 1. Super User
  const { data: superUser, error: superError } =
    await supabaseAdmin.auth.admin.createUser({
      email: "superuser@disdikwil1.go.id",
      password: "SuperUser123!",
      email_confirm: true,
      user_metadata: {
        full_name: "Super User Portal",
        role: "super_user",
        status: "approved",
      },
    });

  if (superError) {
    console.log("Status super user:", superError.message);
  } else {
    console.log("Super user berhasil dibuat:", superUser.user.id);
    await supabaseAdmin
      .from("profiles")
      .update({
        role: "super_user",
        status: "approved",
        full_name: "Super User Portal",
      })
      .eq("id", superUser.user.id);
  }

  // 2. Medium User
  const { data: medUser, error: medError } =
    await supabaseAdmin.auth.admin.createUser({
      email: "mediumuser@disdikwil1.go.id",
      password: "MediumUser123!",
      email_confirm: true,
      user_metadata: {
        full_name: "Medium User Portal",
        role: "medium_user",
        status: "approved",
      },
    });

  if (medError) {
    console.log("Status medium user:", medError.message);
  } else {
    console.log("Medium user berhasil dibuat:", medUser.user.id);
    await supabaseAdmin
      .from("profiles")
      .update({
        role: "medium_user",
        status: "approved",
        full_name: "Medium User Portal",
      })
      .eq("id", medUser.user.id);

    await supabaseAdmin.from("user_application_access").upsert([
      { user_id: medUser.user.id, application_id: "e-arsip" },
      { user_id: medUser.user.id, application_id: "kepegawaian" },
    ]);
  }

  console.log("Proses seed selesai!");
}

run().catch(console.error);
