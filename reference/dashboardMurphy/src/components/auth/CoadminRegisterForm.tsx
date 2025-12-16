import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, User, Phone, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

// Step 1: Email verification schema
const emailSchema = z.object({
  email: z.string().email('Email inválido'),
});

// Step 2: Full registration schema
const registrationSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string().min(8, 'Mínimo 8 caracteres'),
  fullName: z.string().min(2, 'Nombre requerido'),
  phone: z.string().min(10, 'Teléfono inválido'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type EmailFormData = z.infer<typeof emailSchema>;
type RegistrationFormData = z.infer<typeof registrationSchema>;

type FormStep = 'email' | 'register';

export const CoadminRegisterForm = () => {
  const navigate = useNavigate();
  const { checkCoadminEmail, signUpAsCoadmin } = useAuth();
  const [step, setStep] = useState<FormStep>('email');
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patientInfo, setPatientInfo] = useState<{ id: string; name: string } | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState('');

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const registerForm = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      phone: '',
    },
  });

  const onEmailSubmit = async (data: EmailFormData) => {
    setIsChecking(true);
    try {
      const result = await checkCoadminEmail(data.email);
      
      if (result) {
        setPatientInfo({ id: result.patient_profile_id, name: result.patient_name });
        setVerifiedEmail(data.email);
        registerForm.setValue('email', data.email);
        setStep('register');
        toast.success('Email verificado', {
          description: `Eres co-administrador de ${result.patient_name}`,
        });
      } else {
        toast.error('Email no autorizado', {
          description: 'Este email no está registrado como co-administrador de ningún paciente.',
        });
      }
    } catch (error) {
      toast.error('Error al verificar', {
        description: 'Intenta nuevamente.',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const onRegisterSubmit = async (data: RegistrationFormData) => {
    if (!patientInfo) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await signUpAsCoadmin({
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        fullName: data.fullName,
        phone: data.phone,
        patientId: patientInfo.id,
      });

      if (error) {
        toast.error('Error al registrar', { description: error.message });
      } else {
        toast.success('Cuenta creada exitosamente');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'email') {
    return (
      <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Registro de Co-administrador</h2>
          <p className="text-sm text-muted-foreground">
            Ingresa el email que el paciente registró para ti
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email pre-autorizado</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              className="pl-10"
              {...emailForm.register('email')}
            />
          </div>
          {emailForm.formState.errors.email && (
            <p className="text-sm text-destructive">{emailForm.formState.errors.email.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isChecking}>
          {isChecking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verificando...
            </>
          ) : (
            'Verificar Email'
          )}
        </Button>

        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
          <div className="flex gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              Solo puedes registrarte si un paciente ya ingresó tu email como co-administrador.
            </p>
          </div>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Completa tu registro</h2>
        <div className="flex items-center justify-center gap-2 text-sm text-emerald-600">
          <CheckCircle className="h-4 w-4" />
          <span>Co-administrador de {patientInfo?.name}</span>
        </div>
      </div>

      {/* Email (readonly) */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            className="pl-10 bg-muted"
            value={verifiedEmail}
            readOnly
          />
        </div>
      </div>

      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="fullName">Nombre completo</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="fullName"
            type="text"
            placeholder="Tu nombre completo"
            className="pl-10"
            {...registerForm.register('fullName')}
          />
        </div>
        {registerForm.formState.errors.fullName && (
          <p className="text-sm text-destructive">{registerForm.formState.errors.fullName.message}</p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">Teléfono</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="phone"
            type="tel"
            placeholder="3001234567"
            className="pl-10"
            {...registerForm.register('phone')}
          />
        </div>
        {registerForm.formState.errors.phone && (
          <p className="text-sm text-destructive">{registerForm.formState.errors.phone.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            placeholder="Mínimo 8 caracteres"
            className="pl-10"
            {...registerForm.register('password')}
          />
        </div>
        {registerForm.formState.errors.password && (
          <p className="text-sm text-destructive">{registerForm.formState.errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Repite tu contraseña"
            className="pl-10"
            {...registerForm.register('confirmPassword')}
          />
        </div>
        {registerForm.formState.errors.confirmPassword && (
          <p className="text-sm text-destructive">{registerForm.formState.errors.confirmPassword.message}</p>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep('email')}
          className="flex-1"
        >
          Atrás
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creando...
            </>
          ) : (
            'Crear cuenta'
          )}
        </Button>
      </div>
    </form>
  );
};
