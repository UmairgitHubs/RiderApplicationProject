'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { DollarSign, Percent, Info, Users, Loader2 } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'

const paymentFeesSchema = z.object({
  cod_commission: z.any(),
  base_delivery_fee: z.any(),
  min_order_value: z.any(),
  rider_commission: z.any(),
  agent_commission: z.any(),
})

type PaymentFeesFormData = z.infer<typeof paymentFeesSchema>

export default function PaymentFeesSettings() {
  const { settings, isLoading, updateSettings } = useSettings()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PaymentFeesFormData>({
    resolver: zodResolver(paymentFeesSchema),
    defaultValues: {
      cod_commission: '',
      base_delivery_fee: '',
      min_order_value: '',
      rider_commission: '',
      agent_commission: '',
    }
  })

  useEffect(() => {
    if (settings) {
      reset({
        cod_commission: settings.cod_commission,
        base_delivery_fee: settings.base_delivery_fee,
        min_order_value: settings.min_order_value,
        rider_commission: settings.rider_commission,
        agent_commission: settings.agent_commission,
      })
    }
  }, [settings, reset])

  const codCommission = watch('cod_commission') || 0
  const baseDeliveryFee = watch('base_delivery_fee') || 0
  
  const codCommVal = parseFloat(codCommission.toString()) || 0
  const baseDELVal = parseFloat(baseDeliveryFee.toString()) || 0
  
  const exampleOrderValue = 100
  const totalCustomerPays = exampleOrderValue + baseDELVal
  const commissionAmount = (exampleOrderValue * codCommVal) / 100
  const merchantReceives = exampleOrderValue - commissionAmount
  const riderCommissionVal = parseFloat((watch('rider_commission') || 70).toString())
  const riderEarnsCalc = (baseDELVal * riderCommissionVal) / 100

  const onSubmit = async (data: PaymentFeesFormData) => {
    const sanitizedData = {
      cod_commission: Number(data.cod_commission),
      base_delivery_fee: Number(data.base_delivery_fee),
      min_order_value: Number(data.min_order_value),
      rider_commission: Number(data.rider_commission),
      agent_commission: Number(data.agent_commission),
    }

    try {
      await updateSettings(sanitizedData)
    } catch (err) {
      // Failed to update fees
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  return (
    <form id="payment-fees-settings-form" onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-6">
          <DollarSign className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">Fee Structure</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">COD Commission (%)</label>
            <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center text-gray-500 border-r border-gray-200 bg-gray-50 rounded-l-lg">
                    <Percent className="w-4 h-4" />
                </div>
                <input 
                    {...register('cod_commission')}
                    type="number" 
                    step="0.01"
                    className={`w-full pl-12 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 ${errors.cod_commission ? 'border-red-500' : 'border-gray-200'}`}
                />
            </div>
            {errors.cod_commission && <p className="text-xs text-red-500">{errors.cod_commission.message as string}</p>}
            <p className="text-xs text-gray-400">Commission charged on COD transactions</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Base Delivery Fee ($)</label>
            <div className="relative">
                 <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center text-gray-500 border-r border-gray-200 bg-gray-50 rounded-l-lg">
                    <DollarSign className="w-4 h-4" />
                </div>
                <input 
                    {...register('base_delivery_fee')}
                    type="number"
                    step="0.01"
                    className={`w-full pl-12 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 ${errors.base_delivery_fee ? 'border-red-500' : 'border-gray-200'}`}
                />
            </div>
            {errors.base_delivery_fee && <p className="text-xs text-red-500">{errors.base_delivery_fee.message as string}</p>}
            <p className="text-xs text-gray-400">Base delivery fee per order</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Minimum Order Value ($)</label>
            <div className="relative">
                 <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center text-gray-500 border-r border-gray-200 bg-gray-50 rounded-l-lg">
                    <DollarSign className="w-4 h-4" />
                </div>
                <input 
                    {...register('min_order_value')}
                    type="number"
                    step="0.01"
                    className={`w-full pl-12 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 ${errors.min_order_value ? 'border-red-500' : 'border-gray-200'}`}
                />
            </div>
            {errors.min_order_value && <p className="text-xs text-red-500">{errors.min_order_value.message as string}</p>}
             <p className="text-xs text-gray-400">Minimum value for orders</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100"></div>

      <div>
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">Commission Rates</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Rider Commission (%)</label>
            <div className="relative">
                 <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center text-gray-500 border-r border-gray-200 bg-gray-50 rounded-l-lg">
                    <Percent className="w-4 h-4" />
                </div>
                <input 
                    {...register('rider_commission')}
                    type="number"
                    step="0.01"
                    className={`w-full pl-12 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 ${errors.rider_commission ? 'border-red-500' : 'border-gray-200'}`}
                />
            </div>
            {errors.rider_commission && <p className="text-xs text-red-500">{errors.rider_commission.message as string}</p>}
            <p className="text-xs text-gray-400">Percentage of delivery fee paid to riders</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Agent Commission (%)</label>
             <div className="relative">
                 <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center text-gray-500 border-r border-gray-200 bg-gray-50 rounded-l-lg">
                    <Percent className="w-4 h-4" />
                </div>
                <input 
                    {...register('agent_commission')}
                    type="number"
                    step="0.01"
                    className={`w-full pl-12 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 ${errors.agent_commission ? 'border-red-500' : 'border-gray-200'}`}
                />
            </div>
            {errors.agent_commission && <p className="text-xs text-red-500">{errors.agent_commission.message as string}</p>}
            <p className="text-xs text-gray-400">Commission for agent referrals</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
        <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-1">Payment Settings Preview</h4>
                <p className="text-sm text-blue-700 leading-relaxed">
                    For a <span className="font-semibold">${exampleOrderValue} COD order</span>: Customer pays <span className="font-semibold">${totalCustomerPays.toFixed(2)}</span> (including <span className="font-semibold">${baseDELVal.toFixed(2)} delivery fee</span>). 
                    Merchant receives <span className="font-semibold">${merchantReceives.toFixed(2)}</span> (after <span className="font-semibold">{codCommVal}% commission</span>). 
                    Rider earns <span className="font-semibold">${riderEarnsCalc.toFixed(2)}</span> ({riderCommissionVal}% of delivery fee).
                </p>
            </div>
        </div>
      </div>
    </form>
  )
}
