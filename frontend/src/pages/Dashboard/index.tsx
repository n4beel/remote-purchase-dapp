import React, { useCallback, useState } from "react";
import { create as ipfsHttpClient } from "ipfs-http-client";
import Market from "./../../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json";
import { marketAddress } from "../../configure";
import { useNavigate } from "react-router-dom";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import { useDropzone } from "react-dropzone";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";

const client = ipfsHttpClient({ url: "https://ipfs.infura.io:5001/api/v0" });

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

const Dashboard = () => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [formInput, setFormInput] = useState({
    price: "",
    name: "",
    description: "",
  });
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const onDrop = useCallback(async (acceptedFiles: any) => {
    const file = acceptedFiles[0];

    try {
      const added = await client.add(file, {
        progress: (prog: any) => {
          console.log("progress => ", prog);
        },
      });

      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      setFileUrl(url);
    } catch (error) {
      console.log("Error uploading file: ", error);
    }
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const createItem = async () => {
    const { name, price, description } = formInput;
    if (!name || !price || !description || !fileUrl) return;

    const data = JSON.stringify({ name, description, image: fileUrl });

    try {
      const added = await client.add(data);
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;

      createSale(url);
    } catch (error) {
      console.log("Error adding file: ", error);
    }
  };

  const createSale = async (url: any) => {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);

    const signer = provider.getSigner();
    const contract = new ethers.Contract(marketAddress, Market.abi, signer);
    const price = ethers.utils.parseUnits(formInput.price, "ether");

    let listingPrice = await contract.getListingPrice();
    listingPrice = listingPrice.toString();

    const transaction = await contract.createToken(url, price, {
      value: listingPrice,
    });

    await transaction.wait();
    handleClose();
  };

  return (
    <div>
      <Container
        maxWidth="xl"
        sx={{
          display: "flex",
          flexDirection: "row-reverse",
        }}
      >
        <Box
          sx={{
            p: 3,
          }}
        >
          <Button variant="contained" onClick={handleOpen}>
            Create Token
          </Button>
        </Box>
      </Container>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography
            id="modal-modal-title"
            variant="h6"
            component="h2"
            sx={{ mb: 3 }}
          >
            Create Token
          </Typography>
          <Grid container spacing={{ xs: 2, md: 3 }}>
            <Grid item sx={{ width: "100%" }}>
              <TextField
                fullWidth
                id="outlined-basic"
                label="Name"
                variant="outlined"
                name="name"
                onChange={(e) =>
                  setFormInput({ ...formInput, name: e.target.value })
                }
              />
            </Grid>
            <Grid item sx={{ width: "100%" }}>
              <TextField
                fullWidth
                id="outlined-basic"
                label="Description"
                variant="outlined"
                name="description"
                onChange={(e) =>
                  setFormInput({ ...formInput, description: e.target.value })
                }
              />
            </Grid>
            <Grid item sx={{ width: "100%" }}>
              <TextField
                fullWidth
                id="outlined-basic"
                label="Price"
                variant="outlined"
                name="price"
                onChange={(e) =>
                  setFormInput({ ...formInput, price: e.target.value })
                }
              />
            </Grid>
            <Grid item sx={{ width: "100%" }}>
              <div
                {...getRootProps()}
                style={{
                  padding: 24,
                  border: "1px dashed",
                  cursor: "pointer",
                  borderRadius: 5,
                }}
              >
                <input {...getInputProps()} />
                {isDragActive ? (
                  <p>Drop the files here ...</p>
                ) : (
                  <p>Drag 'n' drop some files here, or click to select files</p>
                )}
              </div>
            </Grid>
            <Grid item sx={{ width: "100%" }}>
              <Button
                fullWidth
                variant="contained"
                disabled={
                  !formInput.name ||
                  !formInput.price ||
                  !formInput.description ||
                  !fileUrl
                }
                onClick={createItem}
              >
                Create
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </div>
  );
};

export default Dashboard;
