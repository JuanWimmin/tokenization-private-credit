interface ContractError {
  name: string;
  message: string;
}

export const TOKEN_SALE_ERRORS: Record<number, ContractError> = {
  1: { name: 'EscrowContractNotFound',      message: 'El contrato de escrow no fue encontrado.' },
  2: { name: 'ParticipationTokenNotFound',  message: 'El token de participación no fue encontrado.' },
  3: { name: 'AdminNotFound',               message: 'El administrador del contrato no fue encontrado.' },
  4: { name: 'OnlyAdminCanSetToken',        message: 'Solo el administrador puede configurar el token.' },
  5: { name: 'HardCapExceeded',             message: 'Se ha alcanzado el límite máximo de venta.' },
  6: { name: 'InvestorCapExceeded',         message: 'Has alcanzado el límite máximo de inversión permitido.' },
  7: { name: 'AmountMustBePositive',        message: 'El monto debe ser mayor a cero.' },
};

export const VAULT_ERRORS: Record<number, ContractError> = {
  1:  { name: 'AdminNotFound',                      message: 'El administrador del vault no fue encontrado.' },
  2:  { name: 'OnlyAdminCanChangeAvailability',     message: 'Solo el administrador puede cambiar la disponibilidad del vault.' },
  3:  { name: 'ExchangeIsCurrentlyDisabled',        message: 'El vault no está habilitado para realizar claims en este momento.' },
  4:  { name: 'BeneficiaryHasNoTokensToClaim',      message: 'El beneficiario no tiene tokens disponibles para reclamar.' },
  5:  { name: 'VaultDoesNotHaveEnoughUSDC',         message: 'El vault no tiene suficiente USDC para procesar el claim.' },
  6:  { name: 'TokenAndUsdcCannotBeSame',           message: 'El token de participación y el USDC no pueden ser la misma dirección.' },
  7:  { name: 'InvalidAddressConfiguration',        message: 'Configuración de direcciones inválida: el admin no puede ser el token o el USDC.' },
  8:  { name: 'AlreadyInitialized',                 message: 'El vault ya fue inicializado anteriormente.' },
  9:  { name: 'InvalidRoiPercentage',               message: 'El porcentaje de ROI debe estar entre 0 y 1000.' },
  10: { name: 'EnabledFlagNotFound',                message: 'No se encontró el estado de habilitación del vault.' },
  11: { name: 'RoiPercentageNotFound',              message: 'No se encontró el porcentaje de ROI en el vault.' },
  12: { name: 'TokenAddressNotFound',               message: 'No se encontró la dirección del token de participación.' },
  13: { name: 'UsdcAddressNotFound',                message: 'No se encontró la dirección del USDC.' },
  14: { name: 'ArithmeticOverflow',                 message: 'Error de cálculo interno en el contrato.' },
  15: { name: 'NotInitialized',                     message: 'El vault aún no ha sido inicializado.' },
};
