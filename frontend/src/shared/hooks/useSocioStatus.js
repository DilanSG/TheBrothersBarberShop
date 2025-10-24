import { useState, useEffect } from 'react';
import { sociosService } from '../services/sociosService';
import { useAuth } from '../contexts/AuthContext';

export const useSocioStatus = () => {
  const { user } = useAuth();
  const [socioInfo, setSocioInfo] = useState({
    isSocio: false,
    tipoSocio: null,
    isFounder: false,
    loading: true
  });

  useEffect(() => {
    const checkSocioStatus = async () => {
      if (!user) {
        setSocioInfo({
          isSocio: false,
          tipoSocio: null,
          isFounder: false,
          loading: false
        });
        return;
      }

      try {
        // Solo verificar si es admin (los socios son admin con subrol)
        if (user.role === 'admin') {
          const response = await sociosService.getCurrentUser();
          const userData = response.data;
          
          setSocioInfo({
            isSocio: !!userData.tipoSocio,
            tipoSocio: userData.tipoSocio,
            isFounder: userData.tipoSocio === 'fundador',
            loading: false
          });
        } else {
          setSocioInfo({
            isSocio: false,
            tipoSocio: null,
            isFounder: false,
            loading: false
          });
        }
      } catch (error) {
        console.error('Error verificando estado de socio:', error);
        setSocioInfo({
          isSocio: false,
          tipoSocio: null,
          isFounder: false,
          loading: false
        });
      }
    };

    checkSocioStatus();
  }, [user]);

  return socioInfo;
};

export default useSocioStatus;