import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PatientRegistrationData, Gender } from '@/types/auth';
import { DiabetesType } from '@/types/diabetes';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mail, Lock, Eye, EyeOff, User, Phone, Calendar as CalendarIcon,
  CreditCard, Activity, MapPin, Home, Users, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const currentYear = new Date().getFullYear();

const registrationSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Nombre requerido').max(100, 'Nombre muy largo'),
  phone: z.string().min(10, 'Teléfono inválido'),
  birthDate: z.date({ required_error: 'Fecha de nacimiento requerida' }),
  gender: z.enum(['masculino', 'femenino', 'otro', 'prefiero_no_decir'], {
    required_error: 'Selecciona tu sexo',
  }),
  idNumber: z.string().min(5, 'Número de identidad requerido'),
  diabetesType: z.enum(['Tipo 1', 'Tipo 2', 'Gestacional', 'LADA', 'MODY'], {
    required_error: 'Selecciona tu tipo de diabetes',
  }),
  diagnosisYear: z.number()
    .min(1900, 'Año inválido')
    .max(currentYear, 'Año inválido'),
  city: z.string().min(2, 'Ciudad requerida'),
  estrato: z.number().min(1).max(6),
  coadminName: z.string().optional(),
  coadminPhone: z.string().optional(),
  coadminEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  noCoadmin: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'otro', label: 'Otro' },
  { value: 'prefiero_no_decir', label: 'Prefiero no decir' },
];

const DIABETES_TYPES: DiabetesType[] = ['Tipo 1', 'Tipo 2', 'Gestacional', 'LADA', 'MODY'];

const COLOMBIAN_CITIES = [
  'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
  'Bucaramanga', 'Pereira', 'Santa Marta', 'Manizales', 'Ibagué',
  'Cúcuta', 'Villavicencio', 'Pasto', 'Montería', 'Neiva',
  'Armenia', 'Popayán', 'Sincelejo', 'Valledupar', 'Tunja'
];

interface SectionHeaderProps {
  icon: React.ElementType;
  title: string;
  description?: string;
}

const SectionHeader = ({ icon: Icon, title, description }: SectionHeaderProps) => (
  <div className="flex items-start gap-3 mb-4">
    <div className="p-2 rounded-lg bg-primary/10">
      <Icon className="h-5 w-5 text-primary" />
    </div>
    <div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  </div>
);

export const PatientRegisterForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<PatientRegistrationData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      phone: '',
      gender: undefined,
      idNumber: '',
      diabetesType: undefined,
      diagnosisYear: currentYear,
      city: '',
      estrato: 3,
      coadminName: '',
      coadminPhone: '',
      coadminEmail: '',
      noCoadmin: false,
    },
    mode: 'onBlur',
  });

  const { register, control, watch, formState: { errors } } = form;
  const noCoadmin = watch('noCoadmin');
  const estrato = watch('estrato');

  const onSubmit = async (data: PatientRegistrationData) => {
    setIsSubmitting(true);
    try {
      const { error } = await signUp(data);
      
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error al registrarse',
          description: error.message,
        });
        return;
      }

      toast({
        title: '¡Cuenta creada!',
        description: 'Bienvenido a Murphy',
      });
      
      navigate('/dashboard');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Ocurrió un error inesperado',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollArea className="h-[calc(100vh-200px)] pr-4">
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-lg mx-auto space-y-8 pb-8">
        
        {/* SECTION: Credenciales de Acceso */}
        <section>
          <SectionHeader 
            icon={Lock} 
            title="Credenciales de Acceso" 
            description="Datos para iniciar sesión"
          />
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  className="pl-10"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    className="pl-10 pr-10"
                    {...register('password')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repite tu contraseña"
                    className="pl-10 pr-10"
                    {...register('confirmPassword')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* SECTION: Datos Personales */}
        <section>
          <SectionHeader 
            icon={User} 
            title="Datos Personales" 
            description="Información básica para tu perfil"
          />
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    placeholder="Juan Pérez García"
                    className="pl-10"
                    {...register('fullName')}
                  />
                </div>
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Número de contacto</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    placeholder="+57 300 123 4567"
                    className="pl-10"
                    {...register('phone')}
                  />
                </div>
                {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fecha de nacimiento</Label>
              <Controller
                control={control}
                name="birthDate"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP", { locale: es }) : <span>Selecciona tu fecha de nacimiento</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                        captionLayout="dropdown-buttons"
                        fromYear={1920}
                        toYear={new Date().getFullYear()}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.birthDate && <p className="text-sm text-destructive">{errors.birthDate.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sexo</Label>
                <Controller
                  control={control}
                  name="gender"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tu sexo" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="idNumber">Número de identidad</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="idNumber"
                    placeholder="1234567890"
                    className="pl-10"
                    {...register('idNumber')}
                  />
                </div>
                {errors.idNumber && <p className="text-sm text-destructive">{errors.idNumber.message}</p>}
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* SECTION: Información Médica */}
        <section>
          <SectionHeader 
            icon={Activity} 
            title="Información Médica" 
            description="Datos importantes para tu seguimiento"
          />
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de diabetes</Label>
                <Controller
                  control={control}
                  name="diabetesType"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tu tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {DIABETES_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.diabetesType && <p className="text-sm text-destructive">{errors.diabetesType.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagnosisYear">Año de diagnóstico</Label>
                <Input
                  id="diagnosisYear"
                  type="number"
                  min={1900}
                  max={currentYear}
                  placeholder={`Ej: ${currentYear - 5}`}
                  {...register('diagnosisYear', { valueAsNumber: true })}
                />
                {errors.diagnosisYear && <p className="text-sm text-destructive">{errors.diagnosisYear.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Ciudad de residencia
              </Label>
              <Controller
                control={control}
                name="city"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu ciudad" />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOMBIAN_CITIES.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
            </div>

            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                Estrato socioeconómico: <span className="font-bold text-primary">{estrato || 3}</span>
              </Label>
              <Controller
                control={control}
                name="estrato"
                render={({ field }) => (
                  <Slider
                    min={1}
                    max={6}
                    step={1}
                    value={[field.value || 3]}
                    onValueChange={(vals) => field.onChange(vals[0])}
                    className="w-full"
                  />
                )}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* SECTION: Co-administrador */}
        <section>
          <SectionHeader 
            icon={Users} 
            title="Co-administrador (Opcional)" 
            description="Persona de confianza que puede ayudarte"
          />

          <div className="p-4 rounded-lg bg-muted/50 border border-border mb-4">
            <p className="text-sm text-muted-foreground">
              Un familiar o cuidador que podrá ver tus registros de glucosa y recibir alertas 
              para ayudarte en el manejo de tu diabetes.
            </p>
          </div>

          <div className="flex items-center space-x-2 mb-4">
            <Controller
              control={control}
              name="noCoadmin"
              render={({ field }) => (
                <Checkbox
                  id="noCoadmin"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="noCoadmin" className="text-sm cursor-pointer">
              No tengo co-administrador por ahora
            </Label>
          </div>

          {!noCoadmin && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <Label htmlFor="coadminName">Nombre del co-administrador</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="coadminName"
                    placeholder="María García"
                    className="pl-10"
                    {...register('coadminName')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="coadminPhone">Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="coadminPhone"
                      placeholder="+57 300 123 4567"
                      className="pl-10"
                      {...register('coadminPhone')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coadminEmail">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="coadminEmail"
                      type="email"
                      placeholder="familiar@email.com"
                      className="pl-10"
                      {...register('coadminEmail')}
                    />
                  </div>
                  {errors.coadminEmail && <p className="text-sm text-destructive">{errors.coadminEmail.message}</p>}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 text-base"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Creando cuenta...
            </>
          ) : (
            'Crear cuenta'
          )}
        </Button>
      </form>
    </ScrollArea>
  );
};
