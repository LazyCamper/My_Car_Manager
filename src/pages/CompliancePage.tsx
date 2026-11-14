import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useActiveVehicle } from '../app/ActiveVehicleContext';
import { useRepositories } from '../app/RepositoryContext';
import { Inspection, Insurance } from '../domain/models';
import {
  InspectionFormModal,
  InspectionFormSubmitData,
  InspectionSection,
  InsuranceFormModal,
  InsuranceFormSubmitData,
  InsuranceSection,
} from '../features/compliance';

export const CompliancePage: React.FC = () => {
  const {
    vehicles,
    activeVehicle,
    isLoading: isVehicleLoading,
    selectVehicle,
  } = useActiveVehicle();
  const { complianceRepo } = useRepositories();

  const [currentInspection, setCurrentInspection] = useState<
    Inspection | undefined
  >(undefined);
  const [allInspections, setAllInspections] = useState<Inspection[]>([]);

  const [currentInsurance, setCurrentInsurance] = useState<
    Insurance | undefined
  >(undefined);
  const [allInsurances, setAllInsurances] = useState<Insurance[]>([]);

  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [editingInspection, setEditingInspection] =
    useState<Inspection | null>(null);

  const [isInsuranceModalOpen, setIsInsuranceModalOpen] = useState(false);
  const [editingInsurance, setEditingInsurance] =
    useState<Insurance | null>(null);

  const loadComplianceData = useCallback(
    async (vehicleId: string) => {
      const [currInsp, inspList, currIns, insList] = await Promise.all([
        complianceRepo.getCurrentInspection(vehicleId),
        complianceRepo.getInspectionsByVehicle(vehicleId),
        complianceRepo.getCurrentInsurance(vehicleId),
        complianceRepo.getInsurancesByVehicle(vehicleId),
      ]);
      setCurrentInspection(currInsp);
      setAllInspections(inspList);
      setCurrentInsurance(currIns);
      setAllInsurances(insList);
    },
    [complianceRepo],
  );

  useEffect(() => {
    if (!activeVehicle) {
      setCurrentInspection(undefined);
      setAllInspections([]);
      setCurrentInsurance(undefined);
      setAllInsurances([]);
      return;
    }
    void loadComplianceData(activeVehicle.id);
  }, [activeVehicle, loadComplianceData]);

  const handleSaveInspection = async (data: InspectionFormSubmitData) => {
    await complianceRepo.saveInspection(data);
    if (activeVehicle) {
      await loadComplianceData(activeVehicle.id);
    }
  };

  const handleDeleteInspection = async (id: string) => {
    await complianceRepo.deleteInspection(id);
    if (activeVehicle) {
      await loadComplianceData(activeVehicle.id);
    }
  };

  const handleSaveInsurance = async (data: InsuranceFormSubmitData) => {
    await complianceRepo.saveInsurance(data);
    if (activeVehicle) {
      await loadComplianceData(activeVehicle.id);
    }
  };

  const handleDeleteInsurance = async (id: string) => {
    await complianceRepo.deleteInsurance(id);
    if (activeVehicle) {
      await loadComplianceData(activeVehicle.id);
    }
  };

  return (
    <section aria-labelledby="compliance-title" className="compliance-page">
      <header className="page-header">
        <h1 id="compliance-title" className="page-title">
          검사·보험
        </h1>
      </header>

      {isVehicleLoading ? (
        <div className="empty-state-box">
          <p className="empty-state-desc">차량 정보를 불러오는 중입니다...</p>
        </div>
      ) : !activeVehicle ? (
        <div className="empty-state-box">
          <p className="empty-state-title">등록된 차량이 없습니다</p>
          <p className="empty-state-desc">
            자동차 검사와 보험 정보를 관리하려면 먼저 홈 화면에서 차량을 등록해 주세요.
          </p>
          <Link to="/" className="btn btn-primary touch-target">
            홈에서 차량 등록하기
          </Link>
        </div>
      ) : (
        <>
          <div className="compliance-vehicle-bar">
            <label htmlFor="compliance-vehicle-select" className="sr-only">
              검사·보험 조회 차량 선택
            </label>
            <select
              id="compliance-vehicle-select"
              aria-label="검사·보험 조회 차량 선택"
              className="vehicle-select touch-target"
              value={activeVehicle.id}
              onChange={(e) => void selectVehicle(e.target.value)}
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.plateNumber})
                </option>
              ))}
            </select>
          </div>

          <InspectionSection
            currentInspection={currentInspection}
            allInspections={allInspections}
            onOpenAddModal={() => {
              setEditingInspection(null);
              setIsInspectionModalOpen(true);
            }}
            onSelectInspection={(insp) => {
              setEditingInspection(insp);
              setIsInspectionModalOpen(true);
            }}
          />

          <InsuranceSection
            currentInsurance={currentInsurance}
            allInsurances={allInsurances}
            onOpenAddModal={() => {
              setEditingInsurance(null);
              setIsInsuranceModalOpen(true);
            }}
            onSelectInsurance={(ins) => {
              setEditingInsurance(ins);
              setIsInsuranceModalOpen(true);
            }}
          />

          <InspectionFormModal
            isOpen={isInspectionModalOpen}
            vehicleId={activeVehicle.id}
            initialInspection={editingInspection}
            onClose={() => setIsInspectionModalOpen(false)}
            onSubmit={handleSaveInspection}
            onDelete={editingInspection ? handleDeleteInspection : undefined}
          />

          <InsuranceFormModal
            isOpen={isInsuranceModalOpen}
            vehicleId={activeVehicle.id}
            initialInsurance={editingInsurance}
            onClose={() => setIsInsuranceModalOpen(false)}
            onSubmit={handleSaveInsurance}
            onDelete={editingInsurance ? handleDeleteInsurance : undefined}
          />
        </>
      )}
    </section>
  );
};
