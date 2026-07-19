import Image from "next/image"
import karayebanLogo from "@/public/noproperty.svg"

const page = () => {
  return (
    <div className="flex h-[72px] items-center gap-3 border-b border-gray-100 px-6">
      <Image
        src={karayebanLogo}
        alt="karyeban logo"
        width={460}
        height={80}
        className="h-auto w-[240px] object-contain"
        priority
      />
    </div>
  )
}

export default page
