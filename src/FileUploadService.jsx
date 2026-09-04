import { useEffect, useMemo, useState } from 'react';
import { validateUpload, buildShareUrl } from './lib/fileValidation.js';
import { submitAuthRequest } from './lib/authFlow.js';
import { apiFetch, buildApiUrl } from './lib/apiClient.js';

const initialState = {
  selectedFile: null,
  uploadState: 'idle',
  message: '',
  shareUrl: '',
  fileMeta: null,
  previewUrl: '',
};

const initialAuthState = {
  mode: 'signup',
  email: '',
  password: '',
  username: '',
  loading: false,
  message: '',
  isAuthenticated: false,
  userEmail: '',
  usernameSet: false,
  activeTab: 'upload',
};

function formatBytes(bytes) {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

// NEW: Landing Page Component
function LandingPage({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-[#0f1117] text-white font-sans">
      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-cyan-400 rounded-lg"></div>
          <span className="font-bold text-lg">UploadService</span>
        </div>
        <div className="hidden md:flex gap-8 text-gray-400">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#how" className="hover:text-white">How It Works</a>
        </div>
        <button onClick={onGetStarted} className="px-5 py-2 bg-cyan-400 text-black font-semibold rounded-lg hover:bg-cyan-300">
          Get Started
        </button>
      </nav>

      {/* HERO SECTION */}
      <section className="text-center pt-20 pb-16 px-4">
        <p className="text-cyan-400 text-sm font-semibold mb-3">• File Sharing, Simplified</p>
        
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
          FILE UPLOAD <br/> 
          <span className="text-cyan-400">SERVICE PROGRAM</span>
        </h1>

        <p className="text-gray-400 max-w-2xl mx-auto mb-8">
          Upload, share, and manage your files in seconds. Get a reshareable link for any JPG, PNG, WEBP, or PDF up to 50MB. 
          View, download, and copy your links directly from your dashboard.
        </p>

        <button onClick={onGetStarted} className="px-8 py-3 bg-cyan-400 text-black font-bold rounded-lg hover:bg-cyan-300">
          Get Started Free →
        </button>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="max-w-6xl mx-auto py-20 px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Everything You Need To Share Files</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
            <h3 className="text-xl font-bold text-cyan-400 mb-2">1. Upload Any File</h3>
            <p className="text-gray-400">Drag and drop or select JPG, PNG, WEBP, and PDF files up to 50MB. Fast and secure uploads to the cloud.</p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-2xl border-gray-700">
            <h3 className="text-xl font-bold text-cyan-400 mb-2">2. Get Reshareable Links</h3>
            <p className="text-gray-400">Instantly get a public Cloudinary link after upload. Share it anywhere - WhatsApp, email, or website.</p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
            <h3 className="text-xl font-bold text-cyan-400 mb-2">3. View Files Directly</h3>
            <p className="text-gray-400">See all your uploaded files directly in your dashboard. Preview images and PDFs without leaving the app.</p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
            <h3 className="text-xl font-bold text-cyan-400 mb-2">4. Open Link In Browser</h3>
            <p className="text-gray-400">Click any link to open the file instantly in a new tab. Perfect for quick access and sharing.</p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
            <h3 className="text-xl font-bold text-cyan-400 mb-2">5. Download Files</h3>
            <p className="text-gray-400">Download any file you uploaded back to your device with one click. Keep backups easily.</p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
            <h3 className="text-xl font-bold text-cyan-400 mb-2">6. Copy Link Instantly</h3>
            <p className="text-gray-400">One-click button to copy your file’s shareable link to clipboard. No typing needed.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-gray-900/50 py-20 px-4">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="flex flex-col md:flex-row justify-center gap-10 max-w-4xl mx-auto text-center">
          <div><div className="text-5xl font-bold text-cyan-400 mb-2">1</div><p>Sign Up / Log In</p></div>
          <div><div className="text-5xl font-bold text-cyan-400 mb-2">2</div><p>Upload Your File</p></div>
          <div><div className="text-5xl font-bold text-cyan-400 mb-2">3</div><p>Copy, View, or Download Link</p></div>
        </div>
      </section>

      <footer className="text-center py-8 text-gray-500 border-t border-gray-800">
        © 2026 FILE UPLOAD SERVICE PROGRAM by @DAVBRAINZ
      </footer>
    </div>
  )
}


export default function FileUploadService() {
  const [showLanding, setShowLanding] = useState(true); // NEW: controls landing page
  const [state, setState] = useState(initialState);
  const [authState, setAuthState] = useState(initialAuthState);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await apiFetch('/api/auth/status');
        const payload = await response.json();

        if (payload.hasAccount) {
          setAuthState((prev) => ({...prev, mode: 'signin', message: 'An account already exists. Please sign in.' }));
        }
      } catch (error) {
        console.error(error);
      }
    };

    checkAuthStatus();
  }, []);

  const fileTypeLabel = useMemo(() => {
    if (!state.selectedFile) return 'No file selected';
    const name = state.selectedFile.name || '';
    const extension = name.includes('.')? name.slice(name.lastIndexOf('.')).toLowerCase() : '';
    return `${extension || 'file'} • ${formatBytes(state.selectedFile.size)}`;
  }, [state.selectedFile]);

  const onFileSelect = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setState({...initialState, message: 'Please choose a file to upload.' });
      return;
    }

    const validation = validateUpload(file);
    if (!validation.valid) {
      setState({...initialState, message: validation.error, uploadState: 'error' });
      return;
    }

    setState({
  ...initialState,
      selectedFile: file,
      uploadState: 'ready',
      fileMeta: {
        name: file.name,
        size: file.size,
        type: file.type,
      },
      previewUrl: file.type.startsWith('image/')? URL.createObjectURL(file) : '',
      message: 'File is ready to upload.',
    });
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();

    if (!authState.email ||!authState.password) {
      setAuthState((prev) => ({...prev, message: 'Please enter both email/username and password.' }));
      return;
    }

    setAuthState((prev) => ({...prev, loading: true, message: '' }));

    try {
      const result = await submitAuthRequest({
        mode: authState.mode,
        email: authState.email,
        password: authState.password,
        username: authState.username,
      });

      setAuthState((prev) => ({
    ...prev,
        loading: false,
        message: result.payload.message || 'Success.',
        isAuthenticated: true,
        userEmail: authState.email,
        username: result.payload.user?.username || authState.username,
        usernameSet: Boolean(result.payload.user?.username || authState.username),
      }));

      if (authState.mode === 'signup' || result.usedFallback) {
        setAuthState((prev) => ({...prev, mode: 'signin' }));
      }
    } catch (error) {
      setAuthState((prev) => ({
    ...prev,
        loading: false,
        message: error.message || 'Authentication failed.',
      }));
    }
  };

  const handleUsernameSave = async (event) => {
    event.preventDefault();

    if (!authState.userEmail ||!authState.username.trim()) {
      setAuthState((prev) => ({...prev, message: 'Choose a username before saving it.' }));
      return;
    }

    setAuthState((prev) => ({...prev, loading: true, message: '' }));

    try {
      const response = await apiFetch('/api/auth/username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authState.userEmail, username: authState.username.trim() }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Could not save the username.');
      }

      setAuthState((prev) => ({
    ...prev,
        loading: false,
        message: payload.message || 'Username saved.',
        username: payload.user?.username || prev.username,
        usernameSet: true,
      }));
    } catch (error) {
      setAuthState((prev) => ({
    ...prev,
        loading: false,
        message: error.message || 'Could not save the username.',
      }));
    }
  };

  const onUpload = async () => {
    if (!state.selectedFile) {
      setState((prev) => ({...prev, message: 'Please select a file first.', uploadState: 'error' }));
      return;
    }

    setState((prev) => ({...prev, uploadState: 'uploading', message: 'Uploading file...' }));

    const formData = new FormData();
    formData.append('file', state.selectedFile);

    try {
      const response = await apiFetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Upload failed.');
      }

      const payload = await response.json();
      const shareUrl = payload.url || buildShareUrl(buildApiUrl('/share'), payload.id || 'unknown');

      setState((prev) => ({
    ...prev,
        uploadState: 'success',
        message: 'Upload complete. Share this link securely.',
        shareUrl,
        previewUrl: prev.selectedFile?.type?.startsWith('image/')? shareUrl : prev.previewUrl,
      }));
    } catch (error) {
      setState((prev) => ({
    ...prev,
        uploadState: 'error',
        message: error.message || 'Upload failed. Please try again.',
      }));
    }
  };

  // NEW: Show landing first
  if (showLanding) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  // YOUR ORIGINAL CODE STARTS HERE - UNCHANGED
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-900 to-blue-600 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="upload-card bg-black/30 backdrop-blur-lg rounded-2xl p-10 md:p-14 space-y-6 shadow-2xl">
          {!authState.isAuthenticated? (
            <form className="auth-form" onSubmit={handleAuthSubmit}>
              <div className="auth-header">
                <h2>{authState.mode === 'signup'? 'Create account' : 'Sign in'}</h2>
                <p>{authState.mode === 'signup'? 'Create an account to get started.' : 'Welcome back. Sign in to continue.'}</p>
              </div>

              {authState.mode === 'signup'? (
                <>
                  <label className="field-label" htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={authState.email}
                    onChange={(event) => setAuthState((prev) => ({...prev, email: event.target.value }))}
                    placeholder="you@example.com"
                  />

                  <label className="field-label" htmlFor="username">Username</label>
                  <input
                    id="username"
                    type="text"
                    value={authState.username}
                    onChange={(event) => setAuthState((prev) => ({...prev, username: event.target.value }))}
                    placeholder="Input username"
                  />

                  <label className="field-label" htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={authState.password}
                    onChange={(event) => setAuthState((prev) => ({...prev, password: event.target.value }))}
                    placeholder="Enter password"
                  />
                </>
              ) : (
                <>
                  <label className="field-label" htmlFor="email">Email or Username</label>
                  <input
                    id="email"
                    type="text"
                    value={authState.email}
                    onChange={(event) => setAuthState((prev) => ({...prev, email: event.target.value }))}
                    placeholder="Enter Email or Username"
                  />

                  <label className="field-label" htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={authState.password}
                    onChange={(event) => setAuthState((prev) => ({...prev, password: event.target.value }))}
                    placeholder="Enter password"
                  />
                </>
              )}

              <button type="submit" className="primary-btn" disabled={authState.loading}>
                {authState.loading? 'Please wait...' : authState.mode === 'signup'? 'Sign up' : 'Sign in'}
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={() => setAuthState((prev) => ({
              ...prev,
                  mode: prev.mode === 'signup'? 'signin' : 'signup',
                  message: prev.mode === 'signup'? 'Use your saved account to sign in.' : 'Create a new account.'
                }))}
              >
                {authState.mode === 'signup'? 'Already have an account? Sign in' : 'Need an account? Sign up'}
              </button>

              {authState.message && <div className="status-message info">{authState.message}</div>}
            </form>
          ) : (
            <>
              <div className="topbar">
                <button
                  type="button"
                  className="secondary-btn topbar-btn"
                  onClick={() => setAuthState({...initialAuthState, mode: 'signin', message: 'You have been logged out.' })}
                >
                  Log out
                </button>
              </div>

              <div className="auth-welcome">
                <p>{authState.usernameSet? `@${authState.username}` : authState.userEmail}</p>
                <h2>Welcome back</h2>
              </div>

              <div className="tab-bar" role="tablist" aria-label="Account sections">
                <button
                  type="button"
                  className={`tab-btn ${authState.activeTab === 'upload'? 'active' : ''}`}
                  onClick={() => setAuthState((prev) => ({...prev, activeTab: 'upload' }))}
                >
                  Upload
                </button>
                <button
                  type="button"
                  className={`tab-btn ${authState.activeTab === 'profile'? 'active' : ''}`}
                  onClick={() => setAuthState((prev) => ({...prev, activeTab: 'profile' }))}
                >
                  Profile
                </button>
              </div>

              {authState.activeTab === 'profile'? (
                <form className="auth-form" onSubmit={handleUsernameSave}>
                  <div className="auth-header">
                    <h2>Set up your username</h2>
                    <p>This username will be saved with your account details.</p>
                  </div>

                  <label className="field-label" htmlFor="profile-username">Username</label>
                  <input
                    id="profile-username"
                    type="text"
                    value={authState.username}
                    onChange={(event) => setAuthState((prev) => ({...prev, username: event.target.value }))}
                    placeholder="Choose a username"
                  />

                  <button type="submit" className="primary-btn" disabled={authState.loading}>
                    {authState.loading? 'Saving...' : 'Save username'}
                  </button>

                  {authState.message && <div className="status-message info">{authState.message}</div>}
                </form>
              ) : (
                <>
                  <label className="upload-box" htmlFor="file-input">
                    <span className="upload-title">Upload File</span>
                    <span className="upload-subtitle">Choose a JPG, PNG, WEBP, or PDF up to 50MB</span>
                    <input id="file-input" type="file" onChange={onFileSelect} accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" />
                  </label>

                  <div className="selection-meta" aria-live="polite">
                    <strong>{fileTypeLabel}</strong>
                  </div>

                  <button type="button" className="primary-btn" onClick={onUpload} disabled={state.uploadState === 'uploading'}>
                    {state.uploadState === 'uploading'? 'Uploading...' : 'Upload'}
                  </button>

                  <div className={`status-message ${state.uploadState}`} role="status">
                    {state.message}
                  </div>

                  {state.shareUrl && (
                    <div className="share-box">
                      <label htmlFor="share-link">Shareable link</label>
                      <input id="share-link" value={state.shareUrl} readOnly />
                      <div className="action-row">
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => navigator.clipboard?.writeText(state.shareUrl)}
                        >
                          Copy link
                        </button>
                        <a className="action-link" href={state.shareUrl} target="_blank" rel="noreferrer">
                          Open link
                        </a>
                        <a
                          className="action-link"
                          href={state.shareUrl}
                          download={state.fileMeta?.name || 'uploaded-file'}
                        >
                          Download file
                        </a>
                      </div>
                      {state.previewUrl && (
                        <div className="preview-frame">
                          {state.fileMeta?.type === 'application/pdf'? (
                            <iframe src={state.previewUrl} title="Uploaded PDF preview" className="preview-iframe" />
                          ) : (
                            <img src={state.previewUrl} alt="Uploaded preview" className="preview-image" />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}