import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedAlcoholControl = await deploy("AlcoholControl", {
    from: deployer,
    log: true,
  });

  console.log(`AlcoholControl contract: `, deployedAlcoholControl.address);
};
export default func;
func.id = "deploy_alcoholControl"; // id required to prevent reexecution
func.tags = ["AlcoholControl"];
