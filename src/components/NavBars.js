import React from "react";
import { Link } from "react-router-dom";

export const AdminNav = () => (
  <nav>
    <Link to="/admin-dashboard">Admin Dashboard</Link>
    <Link to="/some-admin-feature">Admin Feature</Link>
  </nav>
);

export const DealerNav = () => (
  <nav>
    <Link to="/dealer-dashboard">Dealer Dashboard</Link>
    <Link to="/some-dealer-feature">Dealer Feature</Link>
  </nav>
);

export const InstallerNav = () => (
  <nav>
    <Link to="/installer-dashboard">Installer Dashboard</Link>
    <Link to="/some-installer-feature">Installer Feature</Link>
  </nav>
);
