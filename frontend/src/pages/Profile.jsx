import React from "react";
import { ArrowRight, Mail, MapPin, UserRound } from "lucide-react";
import { useApp } from "../context/AppContext";
import Button from "../components/ui/Button";

function Profile() {
  const { user } = useApp();

  return (
    <div className="page-content profile-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Akun</span>
          <h1>Profil pengguna</h1>
          <p>Lihat dan kelola informasi dasar akun Anda.</p>
        </div>
      </div>
      <section className="profile-overview-card">
        <div className="profile-overview-header">
          <div className="profile-avatar">{user.name[0].toUpperCase()}</div>
          <div>
            <span className="eyebrow">Profil aktif</span>
            <h2>{user.name}</h2>
            <p>Informasi akun dan identitas pengguna portal.</p>
          </div>
        </div>
        <div className="profile-details-grid">
          <div className="profile-detail-item">
            <Mail size={18} />
            <div>
              <span>Email</span>
              <strong>{user.email}</strong>
            </div>
          </div>
          <div className="profile-detail-item">
            <MapPin size={18} />
            <div>
              <span>Asal instansi</span>
              <strong>{user.institution || "-"}</strong>
            </div>
          </div>
          <div className="profile-detail-item">
            <UserRound size={18} />
            <div>
              <span>NIP</span>
              <strong>{user.nip || "-"}</strong>
            </div>
          </div>
        </div>
        <div className="profile-overview-actions">
          <Button
            variant="primary"
            onClick={() => {
              window.location.assign("/profile/edit");
            }}
          >
            Edit profil <ArrowRight size={16} />
          </Button>
        </div>
      </section>
    </div>
  );
}

export default Profile;