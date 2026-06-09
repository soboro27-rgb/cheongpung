"use client"

import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion"
import Image from "next/image"
import { Star, MapPin, Shield } from "lucide-react"
import { gradeLabel, gradePass } from "@/lib/utils"

type Caregiver = {
  id: string
  bio: string | null
  passPerHour: number
  grade: string
  reviewScore: number
  reviewCount: number
  adminVerified: boolean
  distanceKm: number
  user: { id: string; name: string | null; image: string | null }
}

type Props = {
  caregiver: Caregiver
  onSwipeLeft: () => void
  onSwipeRight: () => void
  isTop: boolean
}

export function SwipeCard({ caregiver, onSwipeLeft, onSwipeRight, isTop }: Props) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])
  const likeOpacity = useTransform(x, [0, 80], [0, 1])
  const nopeOpacity = useTransform(x, [-80, 0], [1, 0])

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > 100) onSwipeRight()
    else if (info.offset.x < -100) onSwipeLeft()
  }

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute w-full cursor-grab active:cursor-grabbing select-none"
      whileTap={{ scale: 1.02 }}
    >
      <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* 프로필 이미지 */}
        <div className="relative h-96 bg-gradient-to-br from-pink-100 to-purple-100">
          {caregiver.user.image ? (
            <Image
              src={caregiver.user.image}
              alt={caregiver.user.name ?? "케어메이트"}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl">
              {caregiver.user.name?.[0] ?? "?"}
            </div>
          )}

          {/* LIKE / NOPE 배지 */}
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-8 left-8 border-4 border-green-400 text-green-400 font-bold text-2xl px-4 py-2 rounded-xl rotate-[-20deg]"
          >
            LIKE
          </motion.div>
          <motion.div
            style={{ opacity: nopeOpacity }}
            className="absolute top-8 right-8 border-4 border-red-400 text-red-400 font-bold text-2xl px-4 py-2 rounded-xl rotate-[20deg]"
          >
            NOPE
          </motion.div>

          {/* 인증 뱃지 */}
          {caregiver.adminVerified && (
            <div className="absolute bottom-4 right-4 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3" />
              국가 인증
            </div>
          )}
        </div>

        {/* 정보 영역 */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">{caregiver.user.name}</h2>
            <span className="bg-purple-100 text-purple-700 text-sm font-medium px-3 py-1 rounded-full">
              {gradeLabel(caregiver.grade)}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              {caregiver.reviewScore.toFixed(1)} ({caregiver.reviewCount}리뷰)
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-gray-400" />
              {caregiver.distanceKm.toFixed(1)}km
            </span>
          </div>

          {caregiver.bio && (
            <p className="text-gray-600 text-sm line-clamp-2">{caregiver.bio}</p>
          )}

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-gray-500 text-sm">시간당</span>
            <span className="text-purple-600 font-semibold">
              {gradePass(caregiver.grade)}패스 / 시간
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
