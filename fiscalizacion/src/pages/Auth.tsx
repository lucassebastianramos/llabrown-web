import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/api';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // First login and 2FA
  const [mustChange, setMustChange] = useState<{ userId: string } | null>(null);
  const [questions, setQuestions] = useState<Array<{ id: string; question: string }>>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [twoFaToken, setTwoFaToken] = useState('');
  const [twoFaCode, setTwoFaCode] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.mustChangePassword && data.userId) {
          setMustChange({ userId: data.userId });
          toast.message('Debes cambiar tu contraseña y configurar preguntas de seguridad');
          return;
        }
        if (data.require2FA && data.token) {
          setTwoFaToken(data.token);
          toast.message('Te enviamos un código 2FA por email');
          return;
        }
        if (data.token) {
          localStorage.setItem('token', data.token);
          toast.success('Ingreso exitoso');
          window.location.href = '/fiscalizacion/dashboard';
          return;
        }
        toast.error('Respuesta de login inesperada');
      } else {
        toast.error('Invalid credentials');
      }
    } catch (error) {
      toast.error('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const completeFirstLogin = async () => {
    try {
      const payload = {
        userId: mustChange!.userId,
        newPassword,
        questions: Object.entries(answers).map(([qid, ans]) => ({ id: qid, question: questions.find(q => q.id === qid)?.question || '', answer: ans })),
      };
      const res = await fetch(apiUrl('/api/auth/first-login'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo completar el primer ingreso');
      toast.success('Configuración completa. Ingresá con tu nueva clave.');
      setMustChange(null);
    } catch (e: any) {
      toast.error(e?.message || 'Error');
    }
  };

  const requestReset = async () => {
    try {
      // Fetch questions for the email, then if OK call request-reset
      const qres = await fetch(apiUrl(`/api/auth/security-questions?email=${encodeURIComponent(resetEmail)}`));
      const qdata = await qres.json().catch(() => null);
      if (!qres.ok) throw new Error(qdata?.error || 'No se pudieron cargar preguntas');
      setQuestions(Array.isArray(qdata?.questions) ? qdata.questions : []);
      setAnswers({});
      if ((qdata?.userId)) {
        // Ask user to answer; then verify
        toast.message('Respondé tus preguntas y luego solicitá el reset.');
      } else {
        toast.message('Si el usuario existe, te llegará un correo.');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Error');
    }
  };

  const verifyAnswersAndReset = async () => {
    try {
      const userIdRes = await fetch(apiUrl(`/api/auth/security-questions?email=${encodeURIComponent(resetEmail)}`));
      const meta = await userIdRes.json().catch(() => null);
      if (!meta?.userId) return toast.message('Si el usuario existe, te llegará un correo.');
      const payload = { userId: meta.userId, answers: Object.entries(answers).map(([id, answer]) => ({ id, answer })) };
      const verify = await fetch(apiUrl('/api/auth/verify-security-answers'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const vd = await verify.json().catch(() => null);
      if (!verify.ok) throw new Error(vd?.error || 'Respuestas incorrectas');
      toast.success('Se envió una clave temporal a tu email. Debes cambiarla al ingresar.');
    } catch (e: any) {
      toast.error(e?.message || 'Error');
    }
  };

  const verify2FA = async () => {
    try {
      const res = await fetch(apiUrl('/api/auth/verify-2fa'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: twoFaToken, code: twoFaCode }) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.token) throw new Error(data?.error || 'Código inválido');
      localStorage.setItem('token', data.token);
      toast.success('Ingreso exitoso');
      window.location.href = '/fiscalizacion/dashboard';
    } catch (e: any) {
      toast.error(e?.message || 'Error 2FA');
    }
  };

  const doReset = async () => {
    try {
      const res = await fetch(apiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: newPassword }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo cambiar la contraseña');
      toast.success('Contraseña actualizada');
    } catch (e: any) {
      toast.error(e?.message || 'Error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!mustChange && !twoFaToken && (
              <>
                <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <Button onClick={handleLogin} disabled={loading} className="w-full">{loading ? 'Logging in...' : 'Login'}</Button>
              </>
            )}

            {twoFaToken && (
              <div className="space-y-2">
                <div className="text-sm">Ingresá el código 2FA enviado a tu email</div>
                <Input placeholder="Código" value={twoFaCode} onChange={(e) => setTwoFaCode(e.target.value)} />
                <Button onClick={verify2FA}>Verificar</Button>
              </div>
            )}

            {mustChange && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Primer ingreso: cambiá tu contraseña</div>
                <Input type="password" placeholder="Nueva contraseña" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                {questions.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Preguntas de seguridad</div>
                    {questions.map((q) => (
                      <div key={q.id} className="space-y-1">
                        <div className="text-xs text-muted-foreground">{q.question}</div>
                        <Input value={answers[q.id] || ''} onChange={(e) => setAnswers((s) => ({ ...s, [q.id]: e.target.value }))} />
                      </div>
                    ))}
                  </div>
                )}
                <Button onClick={completeFirstLogin}>Guardar y continuar</Button>
              </div>
            )}

            <div className="h-px bg-border my-2" />
            <div className="text-sm font-medium">Recuperar contraseña</div>
            <Input type="email" placeholder="Email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
            {questions.length > 0 && (
              <div className="space-y-1">
                {questions.map((q) => (
                  <div key={q.id} className="space-y-1">
                    <div className="text-xs text-muted-foreground">{q.question}</div>
                    <Input value={answers[q.id] || ''} onChange={(e) => setAnswers((s) => ({ ...s, [q.id]: e.target.value }))} />
                  </div>
                ))}
                <Button variant="secondary" onClick={verifyAnswersAndReset}>Enviar clave temporal</Button>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={requestReset}>Cargar preguntas</Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Token" value={resetToken} onChange={(e) => setResetToken(e.target.value)} />
              <Input type="password" placeholder="Nueva contraseña" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <Button variant="outline" onClick={doReset}>Cambiar contraseña</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}