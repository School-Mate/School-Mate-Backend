-- CreateTable
CREATE TABLE "Meal" (
    "id" TEXT NOT NULL,
    "MLSV_FGR" TEXT NOT NULL,
    "DDISH_NM" TEXT NOT NULL,
    "ORPLC_INFO" TEXT NOT NULL,
    "CAL_INFO" TEXT NOT NULL,
    "NTR_INFO" TEXT NOT NULL,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Meal_id_key" ON "Meal"("id");
