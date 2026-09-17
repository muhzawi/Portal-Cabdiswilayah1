import React from "react";
import { useApp } from "../context/AppContext";
import Button from "../components/ui/Button";

function Profile() {
  const { user } = useApp();
  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Akun</span>
          <h1>Profil pengguna</h1>
          <p>Kelola informasi dasar akun Anda.</p>
        </div>
      </div>
      <div className="settings-card profile-card">
        <div className="profile-avatar">{user.name[0].toUpperCase()}</div>
        <div className="profile-info">
          <span className="eyebrow">Nama lengkap</span>
          <h2>{user.name}</h2>
          <span className="eyebrow">Email organisasi</span>
          <p>{user.email}</p>
        </div>
        <Button variant="secondary">Edit profil</Button>
      </div>
    </div>
  );
}

export default Profile;