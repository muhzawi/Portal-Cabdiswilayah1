import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCircle2,
  ClipboardList,
  Download,
  ExternalLink,
  FileText,
  Plus,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import Button from "../components/ui/Button";
import api from "../api";

const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;
const allowedAttachmentTypes = {
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

function formatDate(value) {
  return value
    ? new Date(value).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "-";
}

function SchoolTasks() {
  const { user, apps } = useApp();
  const { id: taskId } = useParams();
  const navigate = useNavigate();
  const isSchool = user?.type === "school";
  const isSuperUser = ["super_user", "superadmin"].includes(user?.role);
  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [detailError, setDetailError] = useState({ id: null, message: "" });

  useEffect(() => {
    let active = true;
    api.get("/api/school-tasks")
      .then((response) => {
        if (active) {
          setTasks(response.data.tasks || []);
          setError("");
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.data?.error || "Gagal memuat daftar tugas.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isSchool, isSuperUser, taskId]);

  useEffect(() => {
    if (!taskId) return undefined;

    let active = true;
    api.get(`/api/school-tasks/${taskId}`)
      .then((response) => {
        if (active) {
          setTask(response.data.task);
          setDetailError({ id: null, message: "" });
        }
      })
      .catch((requestError) => {
        if (active) {
          setDetailError({
            id: taskId,
            message: requestError.response?.data?.error || "Gagal memuat detail tugas.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [taskId]);

  const handleCreateTask = async (event) => {
    event.preventDefault();
    setFormError("");
    setSuccess("");

    if (!applicationId && !targetUrl.trim()) {
      setFormError("Pilih aplikasi tujuan atau isi tautan tugas.");
      return;
    }

    let attachmentPayload = null;
    if (attachment) {
      if (attachment.size > MAX_ATTACHMENT_BYTES) {
        setFormError("Ukuran file maksimal 2 MB.");
        return;
      }
      const extension = attachment.name.slice(attachment.name.lastIndexOf(".")).toLowerCase();
      if (allowedAttachmentTypes[extension] !== attachment.type) {
        setFormError("Jenis file tidak didukung. Gunakan PDF, dokumen Office, teks, CSV, atau gambar PNG/JPG.");
        return;
      }
      try {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("File lampiran gagal dibaca."));
          reader.readAsDataURL(attachment);
        });
        attachmentPayload = {
          name: attachment.name,
          mimeType: attachment.type,
          data: dataUrl.split(",")[1],
        };
      } catch (readError) {
        setFormError(readError.message);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await api.post("/api/school-tasks", {
        title,
        description,
        applicationId,
        targetUrl: targetUrl.trim(),
        attachment: attachmentPayload,
      });
      setSuccess(response.data.message || "Tugas berhasil dikirim ke sekolah.");
      setTitle("");
      setDescription("");
      setApplicationId("");
      setTargetUrl("");
      setAttachment(null);
      const fileInput = document.getElementById("school-task-attachment");
      if (fileInput) fileInput.value = "";
      const tasksResponse = await api.get("/api/school-tasks");
      setTasks(tasksResponse.data.tasks || []);
    } catch (requestError) {
      setFormError(requestError.response?.data?.error || "Gagal mengirim tugas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!task) return;
    setIsCompleting(true);
    setError("");
    try {
      await api.patch(`/api/school-tasks/${task.id}/complete`);
      navigate("/tasks");
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Gagal memperbarui status tugas.");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDownloadAttachment = async () => {
    if (!task) return;
    setIsDownloading(true);
    setError("");
    try {
      const response = await api.get(`/api/school-tasks/${task.id}/attachment`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = task.attachment_name || "lampiran-tugas";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Gagal mengunduh lampiran.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isSchool && !isSuperUser) {
    return (
      <div className="page-content">
        <div className="empty-state"><h3>Fitur tugas hanya tersedia untuk sekolah dan superadmin.</h3></div>
      </div>
    );
  }

  if (taskId) {
    return (
      <div className="page-content school-task-page">
        <Link className="school-task-back" to="/tasks"><ArrowLeft size={17} /> Kembali ke daftar tugas</Link>
        {detailError.id === taskId ? (
          <div className="empty-state"><h3>{detailError.message}</h3></div>
        ) : error ? (
          <div className="empty-state"><h3>{error}</h3></div>
        ) : !task || String(task.id) !== taskId ? (
          <div className="empty-state"><h3>Memuat tugas...</h3></div>
        ) : (
          <article className="school-task-detail">
            <div className="school-task-detail-heading">
              {isSchool ? (
                <span className={`school-task-status ${task.status === "completed" ? "completed" : "pending"}`}>
                  {task.status === "completed" ? "Selesai" : "Perlu dikerjakan"}
                </span>
              ) : (
                <span className="school-task-status pending">Instruksi tugas</span>
              )}
              <span className="school-task-date">Dikirim {formatDate(task.created_at)}</span>
            </div>
            <h1>{task.title}</h1>
            {task.application_name && <p className="school-task-app">Aplikasi: {task.application_name}</p>}
            {task.description && <p className="school-task-description">{task.description}</p>}

            {task.attachment_name && (
              <button
                type="button"
                className="school-task-attachment"
                onClick={handleDownloadAttachment}
                disabled={isDownloading}
              >
                <FileText size={20} />
                <span>{task.attachment_name}<small>{isDownloading ? "Mengunduh..." : "Unduh lampiran instruksi"}</small></span>
                <Download size={18} />
              </button>
            )}

            {task.target_url && (
              <a className="button button-primary school-task-open" href={task.target_url} target="_blank" rel="noreferrer">
                Buka tempat pengerjaan <ExternalLink size={17} />
              </a>
            )}

            {error && <div className="form-error">{error}</div>}
            {isSchool && task.status === "pending" && (
              <div className="school-task-complete-row">
                <p>Setelah menyelesaikan tugas di aplikasi tujuan, tandai tugas ini selesai.</p>
                <Button type="button" disabled={isCompleting} onClick={handleCompleteTask}>
                  <CheckCircle2 size={17} />
                  {isCompleting ? "Menyimpan..." : "Tandai selesai"}
                </Button>
              </div>
            )}
            {isSchool && task.status === "completed" && (
              <div className="school-task-complete-message"><CheckCircle2 size={18} /> Tugas ini sudah ditandai selesai.</div>
            )}
          </article>
        )}
      </div>
    );
  }

  return (
    <div className="page-content school-task-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{isSuperUser ? "Administrasi sekolah" : `Akun Sekolah · NPSN ${user.npsn}`}</span>
          <h1>{isSuperUser ? "Kelola Tugas Sekolah" : "Notifikasi Tugas"}</h1>
          <p>
            {isSuperUser
              ? "Kirim pengingat tugas dan instruksi ke semua sekolah aktif."
              : "Tugas yang belum selesai akan tetap muncul sebagai pengingat."}
          </p>
        </div>
      </div>

      {error && <div className="form-error school-task-message">{error}</div>}
      {success && <div className="form-success school-task-message"><CheckCircle2 size={17} /> {success}</div>}

      {isSuperUser && (
        <form className="school-task-form" onSubmit={handleCreateTask}>
          <div className="school-task-section-title"><Plus size={19} /><h2>Buat tugas baru</h2></div>
          {formError && <div className="form-error">{formError}</div>}

          <label className="school-task-field">
            Judul tugas <span>*</span>
            <input maxLength={255} value={title} onChange={(event) => setTitle(event.target.value)} required disabled={isSubmitting} placeholder="Contoh: Lengkapi data laporan semester" />
          </label>

          <label className="school-task-field">
            Deskripsi / instruksi <small>Opsional</small>
            <textarea maxLength={10000} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} disabled={isSubmitting} placeholder="Jelaskan apa yang perlu dikerjakan sekolah." />
          </label>

          <label className="school-task-field">
            Aplikasi tujuan <small>Opsional jika tautan tugas diisi</small>
            <select value={applicationId} onChange={(event) => setApplicationId(event.target.value)} disabled={isSubmitting}>
              <option value="">Pilih aplikasi</option>
              {apps.map((app) => <option key={app.id} value={app.id}>{app.name}</option>)}
            </select>
          </label>

          <label className="school-task-field">
            Tautan khusus ke tugas <small>Opsional; jika diisi akan menggantikan URL aplikasi</small>
            <input type="url" value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} disabled={isSubmitting} placeholder="https://contoh.go.id/form-tugas" />
          </label>

          <label className="school-task-field">
            File instruksi / lampiran <small>Opsional, maksimal 2 MB</small>
            <input
              id="school-task-attachment"
              type="file"
              accept=".pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg"
              onChange={(event) => setAttachment(event.target.files?.[0] || null)}
              disabled={isSubmitting}
            />
            {attachment && <small className="school-task-selected-file">{attachment.name}</small>}
          </label>

          <div className="school-task-form-footer">
            <p>Tugas akan dikirim ke semua sekolah berstatus aktif. Judul dan tujuan (aplikasi atau tautan) wajib tersedia.</p>
            <Button type="submit" disabled={isSubmitting}>
              <Bell size={17} /> {isSubmitting ? "Mengirim..." : "Kirim tugas"}
            </Button>
          </div>
        </form>
      )}

      <section className="school-task-list-section">
        <div className="school-task-section-title">
          <ClipboardList size={19} />
          <h2>{isSuperUser ? "Tugas terkirim" : "Daftar tugas"}</h2>
        </div>
        {isLoading ? (
          <div className="empty-state"><h3>Memuat daftar tugas...</h3></div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <Bell size={25} />
            <h3>{isSuperUser ? "Belum ada tugas yang dikirim" : "Belum ada tugas untuk sekolah"}</h3>
            <p>{isSuperUser ? "Tugas yang dikirim akan muncul di sini." : "Tugas baru dari superadmin akan muncul di sini."}</p>
          </div>
        ) : (
          <div className="school-task-list">
            {tasks.map((item) => {
              const taskContents = (
                <>
                  <span className={`school-task-list-icon ${item.status === "completed" ? "completed" : "pending"}`}>
                    {item.status === "completed" ? <CheckCircle2 size={19} /> : <Bell size={19} />}
                  </span>
                  <span className="school-task-list-copy">
                    <strong>{item.title}</strong>
                    <span>{isSuperUser
                      ? `${item.completed_count || 0} dari ${item.recipient_count || 0} sekolah menandai selesai`
                      : `${item.application_name ? `${item.application_name} · ` : ""}${formatDate(item.created_at)}${item.attachment_name ? " · Ada lampiran" : ""}`}</span>
                  </span>
                  {isSchool && (
                    <span className={`school-task-status ${item.status === "completed" ? "completed" : "pending"}`}>
                      {item.status === "completed" ? "Selesai" : "Belum selesai"}
                    </span>
                  )}
                  <ArrowRight size={17} />
                </>
              );

              return isSchool ? (
                <div className="school-task-list-item" key={item.id}>
                  <a className="school-task-list-primary" href={item.target_url} target="_blank" rel="noreferrer">
                    {taskContents}
                  </a>
                  <Link className="school-task-detail-link" to={`/tasks/${item.id}`} aria-label={`Lihat instruksi ${item.title}`} title="Lihat instruksi dan tandai selesai">
                    <ClipboardList size={18} />
                  </Link>
                </div>
              ) : (
                <Link className="school-task-list-item" to={`/tasks/${item.id}`} key={item.id}>
                  {taskContents}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default SchoolTasks;
