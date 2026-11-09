'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Building2, Copy, Loader2, MailPlus, ShieldCheck, Users } from 'lucide-react';
import { authedFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import {
  COMPANY_ROLES,
  canChangeMemberRole,
  canManageCompany,
  canManageRole,
  canManageTeam,
  canRemoveMember,
} from '@/lib/company-access';

const EMPTY_PROFILE = {
  name: '',
  legalName: '',
  country: '',
  region: '',
  industry: '',
  companySize: '',
  website: '',
  phone: '',
  address: '',
};

const inputClass = 'w-full bg-base-800 border border-border rounded-lg px-3 py-2 text-sm focus:border-amber outline-none';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [membership, setMembership] = useState(null);
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteLink, setInviteLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadWorkspace = useCallback(async () => {
    const companyData = await authedFetch('/api/companies');
    if (!companyData.company) {
      setCompany(null);
      setMembership(null);
      setMembers([]);
      setInvitations([]);
      return;
    }

    setCompany(companyData.company);
    setMembership(companyData.membership);
    setProfile(Object.fromEntries(
      Object.keys(EMPTY_PROFILE).map((field) => [field, companyData.company[field] || ''])
    ));

    if (canManageTeam(companyData.membership.role)) {
      const teamData = await authedFetch('/api/companies/team');
      setMembers(teamData.members);
      setInvitations(teamData.invitations);
    } else {
      setMembers([]);
      setInvitations([]);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        await loadWorkspace();
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [user, loadWorkspace]);

  function updateProfile(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  async function saveCompany(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await authedFetch('/api/companies', { method: 'PATCH', body: JSON.stringify(profile) });
      setNotice('Company profile updated.');
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function inviteMember(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    setInviteLink('');
    try {
      const result = await authedFetch('/api/companies/invitations', {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      setInviteLink(result.invitationUrl);
      setInviteEmail('');
      const emailMessage = result.emailStatus === 'sent'
        ? 'Invitation email sent.'
        : result.emailStatus === 'failed'
          ? 'Email delivery failed.'
          : 'Invitation email is not configured.';
      setNotice(`${emailMessage} Share the secure link below with ${result.invitation.email}.`);
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function copyInvitation() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setNotice('Invitation link copied.');
    } catch {
      setError('Could not access the clipboard. Select and copy the invitation link manually.');
    }
  }

  async function updateRole(member, role) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await authedFetch(`/api/companies/team/${encodeURIComponent(member.uid)}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      setNotice(`Updated ${member.email || member.name || 'team member'} to ${role}.`);
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(member) {
    if (!window.confirm(`Remove ${member.email || member.name || 'this person'} from the company workspace?`)) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await authedFetch(`/api/companies/team/${encodeURIComponent(member.uid)}`, { method: 'DELETE' });
      setNotice('Team member removed from the workspace.');
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function revokeInvitation(invitation) {
    if (!window.confirm(`Revoke the pending invitation for ${invitation.email}? Its link will stop working.`)) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await authedFetch(`/api/companies/invitations/${encodeURIComponent(invitation.id)}`, { method: 'DELETE' });
      setNotice(`Invitation for ${invitation.email} was revoked.`);
      setInviteLink('');
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-amber" size={26} /></div>;
  }

  if (error && !company) return <Feedback kind="error" message={error} />;

  if (!company || !membership) {
    return (
      <div className="p-6 sm:p-8 max-w-3xl mx-auto">
        <div className="card p-6">
          <h1 className="font-display font-semibold text-2xl">Company workspace</h1>
          <p className="text-sm text-ink-300 mt-2">Set up a company profile to manage teammates and operational access.</p>
          <Link href="/onboarding" className="inline-flex mt-5 bg-amber text-base-900 font-medium text-sm px-4 py-2.5 rounded-lg">
            Set up company workspace
          </Link>
        </div>
      </div>
    );
  }

  const roleOptions = COMPANY_ROLES.filter((role) => canManageRole(membership.role, role));
  const mayManageCompany = canManageCompany(membership.role);
  const mayManageTeam = canManageTeam(membership.role);

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-semibold text-2xl">Company workspace</h1>
          <p className="text-sm text-ink-300 mt-1">Manage organization details, teammates, and access roles.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald/30 bg-emerald/10 px-3 py-1.5 text-xs text-emerald">
          <ShieldCheck size={14} /> Your role: {membership.role}
        </div>
      </div>

      {notice && <Feedback kind="success" message={notice} />}
      {error && <Feedback kind="error" message={error} />}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <Metric icon={Building2} label="Company" value={company.name} />
        <Metric icon={Users} label="Workspace members" value={company.memberCount || members.length || 1} />
        <Metric icon={ShieldCheck} label="Country" value={company.country} />
        <Metric icon={Building2} label="Industry" value={company.industry} />
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <section className="card p-5 sm:p-6">
          <h2 className="font-display font-semibold text-lg mb-1">Company profile</h2>
          <p className="text-xs text-ink-500 mb-5">Used to personalize workspace settings and region-specific guidance.</p>
          {mayManageCompany ? (
            <form onSubmit={saveCompany} className="grid sm:grid-cols-2 gap-3">
              <ProfileField label="Company name" value={profile.name} onChange={(value) => updateProfile('name', value)} required />
              <ProfileField label="Legal name" value={profile.legalName} onChange={(value) => updateProfile('legalName', value)} />
              <ProfileField label="Country" value={profile.country} onChange={(value) => updateProfile('country', value)} required />
              <ProfileField label="Region" value={profile.region} onChange={(value) => updateProfile('region', value)} />
              <ProfileField label="Industry" value={profile.industry} onChange={(value) => updateProfile('industry', value)} required />
              <label className="block">
                <span className="text-xs text-ink-500 mb-1 block">Organization size</span>
                <select value={profile.companySize} onChange={(event) => updateProfile('companySize', event.target.value)} className={inputClass}>
                  {['1-10', '11-50', '51-200', '201-1000', '1000+'].map((size) => <option key={size} value={size}>{size} people</option>)}
                </select>
              </label>
              <ProfileField label="Website" value={profile.website} onChange={(value) => updateProfile('website', value)} type="url" />
              <ProfileField label="Phone" value={profile.phone} onChange={(value) => updateProfile('phone', value)} type="tel" />
              <ProfileField label="Address" value={profile.address} onChange={(value) => updateProfile('address', value)} />
              <div className="sm:col-span-2 mt-1">
                <button disabled={busy} className="bg-amber text-base-900 font-medium text-sm px-4 py-2.5 rounded-lg disabled:opacity-50">
                  {busy ? 'Saving…' : 'Save company profile'}
                </button>
              </div>
            </form>
          ) : (
            <dl className="grid sm:grid-cols-2 gap-4 text-sm">
              {Object.entries({
                'Legal name': company.legalName,
                Country: company.country,
                Region: company.region,
                Industry: company.industry,
                'Organization size': company.companySize,
                Website: company.website,
                Phone: company.phone,
                Address: company.address,
              }).map(([label, value]) => (
                <div key={label}><dt className="text-xs text-ink-500">{label}</dt><dd className="mt-1">{value || 'Not provided'}</dd></div>
              ))}
            </dl>
          )}
        </section>

        <section className="card p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-1"><Users className="text-cyan" size={18} /><h2 className="font-display font-semibold text-lg">Team and access</h2></div>
          <p className="text-xs text-ink-500 mb-5">Invitations expire in seven days and can be accepted only by the invited email address.</p>
          {mayManageTeam ? (
            <>
              <form onSubmit={inviteMember} className="grid sm:grid-cols-[1fr_150px_auto] gap-2 mb-5">
                <input required type="email" maxLength={254} value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="teammate@company.com" className={inputClass} />
                <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value)} className={inputClass}>
                  {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
                <button disabled={busy} className="inline-flex items-center justify-center gap-2 bg-cyan text-base-900 font-medium text-sm px-4 py-2 rounded-lg disabled:opacity-50">
                  <MailPlus size={15} /> Invite
                </button>
              </form>
              {inviteLink && (
                <div className="mb-5 rounded-lg border border-cyan/30 bg-cyan/5 p-3">
                  <p className="text-xs text-ink-300 mb-2">Share this single-use invitation link with the invited teammate.</p>
                  <div className="flex gap-2">
                    <input readOnly value={inviteLink} className={`${inputClass} min-w-0`} aria-label="Invitation link" />
                    <button type="button" onClick={copyInvitation} className="shrink-0 rounded-lg border border-border px-3 text-sm" aria-label="Copy invitation link">
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-left text-xs text-ink-500">
                    <th className="py-2 pr-3 font-medium">Team member</th><th className="py-2 pr-3 font-medium">Role</th><th className="py-2 text-right font-medium">Access</th>
                  </tr></thead>
                  <tbody>
                    {members.map((member) => {
                      const permittedRoles = roleOptions.filter((role) => canChangeMemberRole(membership.role, member.role, role));
                      const canRemove = canRemoveMember(membership.role, member.role, member.uid, user.uid);
                      return (
                        <tr key={member.uid} className="border-b border-border/70 last:border-0">
                          <td className="py-3 pr-3">
                            <div className="font-medium">{member.name || member.email || 'Team member'}</div>
                            <div className="text-xs text-ink-500">{member.email}</div>
                          </td>
                          <td className="py-3 pr-3">
                            {permittedRoles.length > 0 ? (
                              <select disabled={busy} value={member.role} onChange={(event) => updateRole(member, event.target.value)} className="bg-base-800 border border-border rounded-md px-2 py-1 text-xs">
                                <option value={member.role}>{member.role}</option>
                                {permittedRoles.filter((role) => role !== member.role).map((role) => <option key={role} value={role}>{role}</option>)}
                              </select>
                            ) : <span className="capitalize">{member.role}</span>}
                          </td>
                          <td className="py-3 text-right">
                            {canRemove && <button type="button" disabled={busy} onClick={() => removeMember(member)} className="text-xs text-alert hover:underline disabled:opacity-50">Remove</button>}
                          </td>
                        </tr>
                      );
                    })}
                    {members.length === 0 && <tr><td colSpan={3} className="py-5 text-center text-xs text-ink-500">No team members yet.</td></tr>}
                  </tbody>
                </table>
              </div>
              {invitations.length > 0 && (
                <div className="mt-5 border-t border-border pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2">Pending invitations</h3>
                  <ul className="space-y-2">
                    {invitations.map((invite) => (
                      <li key={invite.id} className="flex items-center justify-between gap-3 text-xs">
                        <span className="truncate">{invite.email} <span className="text-ink-500">· {invite.role}</span></span>
                        <div className="shrink-0 flex items-center gap-3">
                          <span className="text-ink-500">Expires {new Date(invite.expiresAt).toLocaleDateString()}</span>
                          {canManageRole(membership.role, invite.role) && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => revokeInvitation(invite)}
                              className="text-alert hover:underline disabled:opacity-50"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-lg border border-border p-4 text-sm text-ink-300">
              Your role can use assigned workspace tools, but team management is limited to owners, admins, and managers.
            </div>
          )}
        </section>
      </div>

      <section className="card p-5 sm:p-6 mt-6">
        <h2 className="font-display font-semibold text-lg mb-3">Role permissions</h2>
        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-3">
          {[
            ['Owner', 'Full company and team administration.'],
            ['Admin', 'Manage company profile and non-admin team roles.'],
            ['Manager', 'Invite members and viewers; cannot change admin access.'],
            ['Member', 'Manage their own operational records; company-wide records are not shared yet.'],
            ['Viewer', 'Read-only access to their own records.'],
          ].map(([role, description]) => (
            <div key={role} className="rounded-lg border border-border p-3">
              <div className="font-medium text-sm">{role}</div>
              <p className="text-xs text-ink-500 mt-1">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-ink-500 mt-5">
        Current operations records in some modules are still owned by individual accounts. Organization-wide sharing and granular module permissions are planned before enterprise rollout.
      </p>
    </div>
  );
}

function ProfileField({ label, value, onChange, required = false, type = 'text' }) {
  return (
    <label className="block">
      <span className="text-xs text-ink-500 mb-1 block">{label}</span>
      <input type={type} required={required} maxLength={type === 'url' ? 2048 : 500} value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} />
    </label>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between text-xs text-ink-500"><span>{label}</span><Icon size={16} className="text-cyan" /></div>
      <div className="font-display font-semibold text-lg mt-2 truncate capitalize">{value || '—'}</div>
    </div>
  );
}

function Feedback({ kind, message }) {
  const success = kind === 'success';
  return (
    <div role={success ? 'status' : 'alert'} className={`flex items-start gap-2 rounded-lg p-3 mb-5 text-sm ${success ? 'bg-emerald/10 border border-emerald/30 text-emerald' : 'bg-alert/10 border border-alert/30 text-alert'}`}>
      {success ? <ShieldCheck size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
      {message}
    </div>
  );
}
